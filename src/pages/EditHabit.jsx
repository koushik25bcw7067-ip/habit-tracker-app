import { useNavigate, useParams, Navigate } from 'react-router-dom'
import HabitForm from '../components/HabitForm'
import PageHeader from '../components/PageHeader'
import { LoadingState } from '../components/ui/States'
import { useHabits } from '../context/HabitsContext'

export default function EditHabit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getHabit, editHabit, loading, habits } = useHabits()
  const habit = getHabit(id)

  if (!habit) {
    // Still loading the habits list for the first time -> show a spinner
    // instead of bouncing straight back to /habits.
    if (loading && habits.length === 0) return <LoadingState label="Loading habit…" />
    return <Navigate to="/habits" replace />
  }

  async function handleSubmit(data) {
    await editHabit(id, data)
    navigate('/habits')
  }

  return (
    <>
      <PageHeader title="Edit Habit" subtitle={habit.name} />
      <HabitForm initial={habit} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </>
  )
}
