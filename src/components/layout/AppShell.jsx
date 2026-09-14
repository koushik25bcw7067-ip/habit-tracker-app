import { useLocation } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function AppShell({ children }) {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-surface">
      <Header pathname={pathname} />
      <Sidebar />
      <main className="flex-1 flex flex-col w-full pt-16 pb-24 md:pb-8 md:pl-64 min-h-screen">
        <div className="flex flex-col w-full max-w-3xl mx-auto px-gutter md:px-gutter-lg pb-8 gap-space-md">{children}</div>
      </main>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
