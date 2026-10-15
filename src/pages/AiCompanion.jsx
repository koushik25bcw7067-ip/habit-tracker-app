import { useState, useRef, useEffect } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import PageHeader from '../components/PageHeader'
import { chat as chatApi } from '../api/ai'
import { emitCompanionAction, sendVoiceTurn } from '../api/companion'
import { ApiError } from '../api/client'

const GREETING = {
  role: 'assistant',
  content: "Hi! I'm your habit companion. Ask me about a habit you missed, how your consistency is trending, or what to focus on next — I'll answer using your real tracked data.",
}

function Bubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-body-md whitespace-pre-wrap ${
          isUser ? 'bg-primary text-on-primary rounded-br-sm' : 'bg-surface-container-lowest shadow-card-1 text-on-surface rounded-bl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-surface-container-lowest shadow-card-1 rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

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

function resampleTo16k(audioBuffer) {
  const input = audioBuffer.getChannelData(0)
  const ratio = audioBuffer.sampleRate / 16000
  const output = new Float32Array(Math.ceil(input.length / ratio))
  for (let i = 0; i < output.length; i += 1) {
    const start = Math.floor(i * ratio)
    const end = Math.min(Math.ceil((i + 1) * ratio), input.length)
    let total = 0
    for (let j = start; j < end; j += 1) total += input[j]
    output[i] = total / Math.max(1, end - start)
  }
  return output
}

export default function AiCompanion() {
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const recordTimeoutRef = useRef(null)
  const [recording, setRecording] = useState(false)
  const [voiceBusy, setVoiceBusy] = useState(false)
  const [voiceError, setVoiceError] = useState(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function send(text) {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setError(null)
    const nextMessages = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)
    try {
      // Only role/content history is sent to the backend — the backend adds
      // verified habit statistics as system context server-side and calls
      // the AI provider itself. No API keys ever reach the browser.
      const apiHistory = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }))
      const res = await chatApi(apiHistory)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      // Roll the optimistic user message's send state back so Retry can resend it.
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    send(input)
  }

  function retry() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUser) send(lastUser.content)
  }

  function clearConversation() {
    setMessages([GREETING])
    setError(null)
  }

  function releaseMicrophone() {
    if (recordTimeoutRef.current) window.clearTimeout(recordTimeoutRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
    setRecording(false)
  }

  async function handleVoiceRecording() {
    if (recording) {
      recorderRef.current?.stop()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceError('This browser does not support microphone recording.')
      return
    }
    setVoiceError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : undefined
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        releaseMicrophone()
        if (!chunksRef.current.length) return
        setVoiceBusy(true)
        setVoiceError(null)
        try {
          const recordingBlob = new Blob(chunksRef.current, { type: recorder.mimeType })
          const decodeContext = new AudioContext()
          try {
            const audioBuffer = await decodeContext.decodeAudioData(await recordingBlob.arrayBuffer())
            const wav = wavFromSamples(resampleTo16k(audioBuffer))
            const result = await sendVoiceTurn(wav)
            if (result.transcript) {
              setMessages((previous) => [
                ...previous,
                { role: 'user', content: result.transcript },
                { role: 'assistant', content: result.reply },
              ])
            }
            if (result.status === 'completed' && result.actionType) {
              emitCompanionAction(result.actionType)
            }
            if (result.audio?.size) {
              const audioUrl = URL.createObjectURL(result.audio)
              const player = new Audio(audioUrl)
              let fallbackSpoken = false
              const speakFallback = () => {
                URL.revokeObjectURL(audioUrl)
                if (!fallbackSpoken && window.speechSynthesis) {
                  fallbackSpoken = true
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance(result.reply))
                } else if (!window.speechSynthesis) {
                  setVoiceError('Audio playback failed. The reply is shown in chat.')
                }
              }
              player.onended = () => URL.revokeObjectURL(audioUrl)
              player.onerror = speakFallback
              player.play().catch(() => {
                speakFallback()
              })
            } else if (window.speechSynthesis) {
              window.speechSynthesis.speak(new SpeechSynthesisUtterance(result.reply))
              setVoiceError('Server audio was unavailable; using this browser’s voice.')
            } else {
              setVoiceError('Server audio was unavailable. The reply is shown in chat.')
            }
          } finally {
            await decodeContext.close()
          }
        } catch (err) {
          setVoiceError(err instanceof ApiError ? err.message : 'Could not process this recording. Please try again.')
        } finally {
          setVoiceBusy(false)
        }
      }
      recorder.start()
      setRecording(true)
      recordTimeoutRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, 15_000)
    } catch (err) {
      releaseMicrophone()
      setVoiceError(err instanceof Error ? err.message : 'Could not access the microphone.')
    }
  }

  useEffect(() => () => {
    if (recordTimeoutRef.current) window.clearTimeout(recordTimeoutRef.current)
    if (recorderRef.current) {
      recorderRef.current.onstop = null
      if (recorderRef.current.state === 'recording') recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] md:h-[calc(100vh-6rem)]">
      <PageHeader
        title="AI Companion"
        subtitle="A supportive assistant grounded in your real habit data"
        action={
          <Button variant="ghost" size="sm" onClick={clearConversation}>
            <Icon name="delete_sweep" size={16} className="mr-1.5" />
            Clear
          </Button>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-2.5 pb-3 pr-0.5">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {sending && <TypingIndicator />}
        {error && (
          <div className="flex items-center gap-2 bg-error-container/50 text-on-error-container rounded-md px-3.5 py-2.5 text-body-sm self-start">
            <Icon name="error" size={16} className="flex-shrink-0" />
            {error}
            <button onClick={retry} className="font-semibold underline flex-shrink-0">
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 py-2">
        <Button
          type="button"
          variant={recording ? 'danger' : 'secondary'}
          disabled={voiceBusy || sending}
          onClick={handleVoiceRecording}
        >
          <Icon name={recording ? 'stop' : 'mic'} size={18} className="mr-2" />
          {recording ? 'Stop recording' : voiceBusy ? 'Processing voice…' : 'Record voice command'}
        </Button>
        <span className="text-body-sm text-on-surface-variant">
          Speak for up to 15 seconds. Changes require a spoken confirmation.
        </span>
      </div>
      {voiceError && (
        <div role="alert" className="text-body-sm text-on-error-container bg-error-container/50 rounded-md px-3 py-2">
          {voiceError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-surface-container-high">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a habit, streak, or what to focus on…"
          className="flex-1 h-12 rounded-full bg-surface-container-low border border-outline-variant/70 px-4 text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send"
          className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 disabled:opacity-50 active:scale-95 transition-all"
        >
          <Icon name="send" size={20} />
        </button>
      </form>
    </div>
  )
}
