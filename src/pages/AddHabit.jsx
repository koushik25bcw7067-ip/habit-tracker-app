import { useNavigate } from 'react-router-dom'
import HabitForm from '../components/HabitForm'
import PageHeader from '../components/PageHeader'
import { useTheme } from '../context/ThemeContext'
import { useHabits } from '../context/HabitsContext'

export default function AddHabit() {
  const { t } = useTheme()
  const navigate = useNavigate()
  const { addHabit } = useHabits()

  async function handleSubmit(data) {
    await addHabit(data)
    navigate('/habits')
  }

  return (
    <>
      <PageHeader title={`Add ${t('habit')}`} subtitle="Set up a routine to track" />
      <HabitForm onSubmit={handleSubmit} submitLabel="Create Routine" />
    </>
  )
}
