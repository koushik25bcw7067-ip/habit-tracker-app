import { useState, useRef, useEffect } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import PageHeader from '../components/PageHeader'
import { chat as chatApi } from '../api/ai'
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

export default function AiCompanion() {
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

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
