// A tiny event bus so any page/context can tell the companion that something meaningful happened
// without importing it:  emitCompanion('habit_done', { habit, remaining, next, streak })
//
// Types: habit_created | habit_done | habit_undone | task_created | task_done | streak | milestone
//        theme_changed | achievement | missed | thinking | speak
export const COMPANION_EVENT = 'companion:event'

export function emitCompanion(type, payload = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(COMPANION_EVENT, { detail: { type, payload } }))
}

export function onCompanion(handler) {
  const fn = (e) => handler(e.detail?.type, e.detail?.payload || {})
  window.addEventListener(COMPANION_EVENT, fn)
  return () => window.removeEventListener(COMPANION_EVENT, fn)
}
