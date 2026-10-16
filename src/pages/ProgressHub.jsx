import { useSearchParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Reminders from './Reminders'
import Achievements from './Achievements'

const TABS = [
  { id: 'reminders', label: 'Reminders', icon: 'notifications' },
  { id: 'achievements', label: 'Achievements', icon: 'emoji_events' },
]

const PAGES = {
  reminders: Reminders,
  achievements: Achievements,
}

export default function ProgressHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = TABS.some((tab) => tab.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'reminders'
  const Page = PAGES[selected]

  function selectTab(tab) {
    setSearchParams({ tab }, { replace: true })
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto border-b border-surface-container-high" role="tablist" aria-label="Progress tools">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`progress-tab-${tab.id}`}
            aria-selected={selected === tab.id}
            aria-controls="progress-tab-panel"
            onClick={() => selectTab(tab.id)}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-label-md font-semibold transition-colors ${
              selected === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name={tab.icon} size={18} />
            {tab.label}
          </button>
        ))}
      </div>
      <section id="progress-tab-panel" role="tabpanel" aria-labelledby={`progress-tab-${selected}`}>
        <Page />
      </section>
    </>
  )
}
