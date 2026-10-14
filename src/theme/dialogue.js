// Contextual dialogue: picks a line for an event/page, fills {placeholders} from real data,
// avoids repeating the last few lines and prefers lines whose placeholders we can actually fill.

const PH = /\{(\w+)\}/g

export function fillLine(line, vars = {}) {
  return String(line).replace(PH, (_, k) => {
    const v = vars[k]
    return v === undefined || v === null || v === '' ? '' : String(v)
  }).replace(/\s+([,.!?;:])/g, '$1').replace(/\s{2,}/g, ' ').trim()
}

const canFill = (line, vars) => [...String(line).matchAll(PH)].every(([, k]) => vars[k] !== undefined && vars[k] !== null && vars[k] !== '')

/**
 * @param {string[]} pool   candidate lines
 * @param {object}   vars   {name, habit, task, count, streak}
 * @param {string[]} recent ring buffer of recently used raw lines (mutated)
 * @returns {string|null}
 */
export function pickLine(pool, vars = {}, recent = []) {
  if (!Array.isArray(pool) || pool.length === 0) return null
  const fillable = pool.filter((l) => canFill(l, vars))
  const base = fillable.length ? fillable : pool.filter((l) => !PH.test(l) || ((PH.lastIndex = 0), false))
  PH.lastIndex = 0
  const list = base.length ? base : pool
  const fresh = list.filter((l) => !recent.includes(l))
  const choices = fresh.length ? fresh : list
  const raw = choices[Math.floor(Math.random() * choices.length)]
  recent.push(raw)
  if (recent.length > 10) recent.shift()
  return fillLine(raw, vars)
}

/** Line shown when a page opens. Falls back to nothing (companion stays quiet) if the world has none. */
export function pageLine(theme, pageKey, vars) {
  const l = theme?.lines?.pages?.[pageKey]
  return l ? fillLine(l, vars) : null
}
