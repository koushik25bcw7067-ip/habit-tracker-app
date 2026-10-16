import { useSearchParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Recommendations from './Recommendations'
import AiReport from './AiReport'
import AiCompanion from './AiCompanion'

const TABS = [
  { id: 'recommendations', label: 'Recommendations', icon: 'auto_awesome' },
  { id: 'report', label: 'AI Report', icon: 'summarize' },
  { id: 'companion', label: 'AI Companion', icon: 'forum' },
]

const PAGES = {
  recommendations: Recommendations,
  report: AiReport,
  companion: AiCompanion,
}

export default function AiHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = TABS.some((tab) => tab.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'recommendations'
  const Page = PAGES[selected]

  function selectTab(tab) {
    setSearchParams({ tab }, { replace: true })
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto border-b border-surface-container-high" role="tablist" aria-label="AI tools">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`ai-tab-${tab.id}`}
            aria-selected={selected === tab.id}
            aria-controls="ai-tab-panel"
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
      <section id="ai-tab-panel" role="tabpanel" aria-labelledby={`ai-tab-${selected}`}>
        <Page />
      </section>
    </>
  )
}
