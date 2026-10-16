import { useCallback, useEffect, useRef, useState } from 'react'
import { emitCompanionAction, sendVoiceTurn } from '../api/companion'

const MAX_RECORDING_MS = 15_000
const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
]

function wavFromSamples(samples) {
  const bytes = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(bytes)
  const writeText = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }
  writeText(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, 16000, true)
  view.setUint32(28, 32000, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeText(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
  }
  return new Blob([bytes], { type: 'audio/wav' })
}

async function toWav(blob) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) throw new Error('Audio processing is not supported in this browser.')
  const context = new AudioContextClass()
  try {
    const audioBuffer = await context.decodeAudioData(await blob.arrayBuffer())
    const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, i) => audioBuffer.getChannelData(i))
    const mono = new Float32Array(audioBuffer.length)
    channels.forEach((channel) => {
      for (let i = 0; i < channel.length; i += 1) mono[i] += channel[i] / channels.length
    })
    const ratio = audioBuffer.sampleRate / 16000
    const samples = new Float32Array(Math.ceil(mono.length / ratio))
    for (let i = 0; i < samples.length; i += 1) {
      const start = Math.floor(i * ratio)
      const end = Math.min(Math.ceil((i + 1) * ratio), mono.length)
      let total = 0
      for (let j = start; j < end; j += 1) total += mono[j]
      samples[i] = total / Math.max(1, end - start)
    }
    return wavFromSamples(samples)
  } finally {
    if (context.state !== 'closed') await context.close()
  }
}

export function useVoiceCompanion({ onResult } = {}) {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState('')
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timeoutRef = useRef(null)
  const audioRef = useRef(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const releaseMicrophone = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
    setRecording(false)
  }, [])

  const playReply = useCallback(async (reply, audio) => {
    if (audio?.size) {
      const url = URL.createObjectURL(audio)
      const player = new Audio(url)
      audioRef.current = player
      let playbackFailed = false
      let finish
      const completed = new Promise((resolve) => { finish = resolve })
      player.onplay = () => setSpeaking(true)
      player.onended = () => finish()
      player.onerror = () => {
        playbackFailed = true
        finish()
      }
      try {
        await player.play()
        await completed
      } catch {
        playbackFailed = true
      } finally {
        player.onplay = null
        player.onended = null
        player.onerror = null
        player.pause()
        URL.revokeObjectURL(url)
        audioRef.current = null
        setSpeaking(false)
      }
      if (!playbackFailed) return
      setError('Server audio could not play. Trying your browser voice instead.')
    }

    if (!window.speechSynthesis) {
      setError('Audio playback is unavailable. The reply is shown in the conversation.')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(reply)
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => {
      setSpeaking(false)
      setError('The reply is shown in the conversation, but voice playback failed.')
    }
    window.speechSynthesis.speak(utterance)
  }, [])

  const handleRecording = useCallback(async () => {
    if (recording) {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Microphone recording is not supported. Use a current browser over HTTPS.')
      return
    }

    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      streamRef.current = stream
      chunksRef.current = []
      const mimeType = typeof MediaRecorder.isTypeSupported === 'function'
        ? MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
        : undefined
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        releaseMicrophone()
        if (!blob.size) {
          setError('No audio was captured. Check your microphone and try again.')
          return
        }
        setProcessing(true)
        try {
          const result = await sendVoiceTurn(await toWav(blob))
          if (!result.transcript || !result.reply) {
            throw new Error('The voice service returned no transcript or reply. Please try again.')
          }
          onResultRef.current?.(result)
          if (result.status === 'completed' && result.actionType) emitCompanionAction(result.actionType)
          await playReply(result.reply, result.audio)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'Could not process the recording. Please try again.')
        } finally {
          setProcessing(false)
        }
      }
      recorder.onerror = () => {
        recorder.onstop = null
        releaseMicrophone()
        setError('Recording failed. Check your microphone and try again.')
      }
      recorder.start(250)
      setRecording(true)
      timeoutRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, MAX_RECORDING_MS)
    } catch (cause) {
      releaseMicrophone()
      const message = cause instanceof Error ? cause.message : ''
      setError(message || 'Could not access the microphone. Check microphone permissions and try again.')
    }
  }, [playReply, recording, releaseMicrophone])

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    if (recorderRef.current) {
      recorderRef.current.onstop = null
      recorderRef.current.onerror = null
      if (recorderRef.current.state === 'recording') recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    audioRef.current?.pause()
    window.speechSynthesis?.cancel()
  }, [])

  return { recording, processing, speaking, error, setError, handleRecording }
}
