import { useState, useRef, useEffect, useCallback } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import PageHeader from '../components/PageHeader'
import {
  chat as chatApi,
  createConversation,
  deleteConversation,
  getConversationMessages,
  listConversations,
} from '../api/ai'
import { ApiError } from '../api/client'
import { useVoiceCompanion } from '../hooks/useVoiceCompanion'

const GREETING = {
  role: 'assistant',
  content: "Hi! I'm your routine companion. Ask me about a routine you missed, how your consistency is trending, or what to focus on next — I'll answer using your real tracked data.",
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

export default function AiCompanion() {
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)
  const historyRequestRef = useRef(0)

  const refreshConversations = useCallback(async () => {
    const items = await listConversations()
    setConversations(items)
    return items
  }, [])

  const openConversation = useCallback(async (id) => {
    const requestId = ++historyRequestRef.current
    setActiveConversationId(id)
    setLoadingHistory(true)
    setError(null)
    try {
      const history = await getConversationMessages(id)
      if (requestId === historyRequestRef.current) {
        const loadedMessages = history.map(({ role, content }) => ({ role, content }))
        setMessages(loadedMessages.length ? loadedMessages : [GREETING])
      }
    } catch (err) {
      if (requestId === historyRequestRef.current) {
        setError(err instanceof ApiError ? err.message : 'Could not load this conversation.')
      }
    } finally {
      if (requestId === historyRequestRef.current) setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    async function initialize() {
      try {
        const items = await listConversations()
        if (!active) return
        setConversations(items)
        if (items.length) {
          await openConversation(items[0].id)
        } else {
          const created = await createConversation()
          if (!active) return
          setConversations([created])
          await openConversation(created.id)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Could not load your conversations.')
          setLoadingHistory(false)
        }
      }
    }
    initialize()
    return () => {
      active = false
      historyRequestRef.current += 1
    }
  }, [openConversation])

  async function startConversation() {
    setError(null)
    setLoadingHistory(true)
    try {
      const created = await createConversation()
      setConversations((items) => [created, ...items])
      await openConversation(created.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create a conversation.')
      setLoadingHistory(false)
    }
  }

  async function removeConversation(id) {
    if (!window.confirm('Delete this conversation and its saved messages?')) return
    setError(null)
    try {
      await deleteConversation(id)
      const remaining = await refreshConversations()
      if (activeConversationId === id) {
        if (remaining.length) await openConversation(remaining[0].id)
        else await startConversation()
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this conversation.')
    }
  }

  const handleVoiceResult = useCallback((result) => {
    if (result.conversationId) {
      void refreshConversations().catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not refresh your conversations.')
      })
      void openConversation(Number(result.conversationId))
      return
    }
    setMessages((previous) => [
      ...previous,
      { role: 'user', content: result.transcript },
      { role: 'assistant', content: result.reply },
    ])
  }, [openConversation, refreshConversations])

  const { recording, processing: voiceBusy, inputLevel, error: voiceError, handleRecording } =
    useVoiceCompanion({
      onResult: handleVoiceResult,
    })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function send(text, retrying = false) {
    const trimmed = text.trim()
    if (!trimmed || sending || !activeConversationId) return
    setError(null)
    const nextMessages = retrying ? messages : [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    if (!retrying) setInput('')
    setSending(true)
    try {
      // Only role/content history is sent to the backend — the backend adds
      // verified habit statistics as system context server-side and calls
      // the AI provider itself. No API keys ever reach the browser.
      const apiHistory = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }))
        .slice(-40)
      const res = await chatApi(apiHistory, activeConversationId)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }])
      void refreshConversations().catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not refresh your conversations.')
      })
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
    if (lastUser) send(lastUser.content, true)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] md:h-[calc(100vh-6rem)]">
      <PageHeader
        title="AI Companion"
        subtitle="A supportive assistant grounded in your real routine data"
      />

      <div className="flex min-h-0 flex-1 gap-3">
        <aside className="w-44 md:w-56 flex-shrink-0 overflow-y-auto rounded-xl bg-surface-container-low p-2">
          <Button size="sm" variant="outline" fullWidth onClick={startConversation} disabled={loadingHistory || sending || voiceBusy}>
            <Icon name="add" size={16} className="mr-1" />
            New chat
          </Button>
          <div className="mt-2 flex flex-col gap-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center gap-1 rounded-md px-2 ${
                  conversation.id === activeConversationId
                    ? 'bg-surface-container-high'
                    : 'hover:bg-surface-container-high/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => openConversation(conversation.id)}
                  disabled={sending || voiceBusy}
                  className="min-w-0 flex-1 py-2 text-left text-body-sm text-on-surface disabled:opacity-60"
                  title={conversation.title}
                >
                  <span className="block truncate">{conversation.title}</span>
                  {conversation.source !== 'web' && (
                    <span className="block truncate text-caption text-on-surface-variant">
                      {conversation.source === 'hardware' ? 'ESP32' : 'Voice'}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${conversation.title}`}
                  onClick={() => removeConversation(conversation.id)}
                  disabled={sending || voiceBusy}
                  className="rounded p-1 text-on-surface-variant hover:text-error disabled:opacity-50"
                >
                  <Icon name="delete" size={16} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-2.5 pb-3 pr-0.5">
            {loadingHistory ? (
              <p className="text-body-sm text-on-surface-variant">Loading conversation…</p>
            ) : messages.map((m, i) => (
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
              disabled={voiceBusy || sending || loadingHistory}
              onClick={handleRecording}
            >
              <Icon name={recording ? 'stop' : 'mic'} size={18} className="mr-2" />
              {recording ? 'Stop recording' : voiceBusy ? 'Processing voice…' : 'Record voice command'}
            </Button>
            <span className="text-body-sm text-on-surface-variant">
              Speak for up to 15 seconds. Changes require a spoken confirmation.
            </span>
          </div>
          {recording && (
            <div className="flex items-center gap-2 pb-2" role="status" aria-live="polite">
              <span className="text-body-sm text-on-surface-variant">Microphone level</span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-high"
                role="meter"
                aria-label="Microphone input level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(inputLevel * 100)}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-100 ${inputLevel < 0.02 ? 'bg-error' : 'bg-tertiary'}`}
                  style={{ width: `${Math.max(inputLevel > 0 ? 3 : 0, inputLevel * 100)}%` }}
                />
              </div>
              <span className="text-body-sm text-on-surface-variant">
                {inputLevel < 0.02 ? 'No input detected' : 'Input detected'}
              </span>
            </div>
          )}
          {voiceError && (
            <div role="alert" className="text-body-sm text-on-error-container bg-error-container/50 rounded-md px-3 py-2">
              {voiceError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-surface-container-high">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a routine, streak, or what to focus on…"
              disabled={loadingHistory || !activeConversationId}
              className="flex-1 h-12 rounded-full bg-surface-container-low border border-outline-variant/70 px-4 text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || loadingHistory || !activeConversationId || !input.trim()}
              aria-label="Send"
              className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 disabled:opacity-50 active:scale-95 transition-all"
            >
              <Icon name="send" size={20} />
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
