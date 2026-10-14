// Shared by the mascot and HabitsContext: "is this habit still owed today?"
export function todayLocalISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Active, not archived, scheduled for today (custom schedules respected), and not done yet. */
export function isPendingToday(habit, now = new Date()) {
  if (!habit || habit.archived || habit.active === false || habit.completedToday) return false
  if (habit.frequencyRaw === 'custom' && Array.isArray(habit.targetDaysRaw) && habit.targetDaysRaw.length) {
    const idx = (now.getDay() + 6) % 7 // 0 = Monday, matches the backend's target_days
    return habit.targetDaysRaw.includes(idx)
  }
  return true
}
