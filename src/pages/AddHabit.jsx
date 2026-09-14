import { useNavigate } from 'react-router-dom'
import HabitForm from '../components/HabitForm'
import PageHeader from '../components/PageHeader'
import { useHabits } from '../context/HabitsContext'

export default function AddHabit() {
  const navigate = useNavigate()
  const { addHabit } = useHabits()

  async function handleSubmit(data) {
    await addHabit(data)
    navigate('/habits')
  }

  return (
    <>
      <PageHeader title="Add Habit" subtitle="Define a new habit to track" />
      <HabitForm onSubmit={handleSubmit} submitLabel="Create Habit" />
    </>
  )
}
