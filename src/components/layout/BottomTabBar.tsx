import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/itinerary', label: '일정', icon: '🗓' },
  { to: '/chat',      label: '채팅', icon: '💬' },
  { to: '/notes',     label: '메모', icon: '📝' },
  { to: '/checklist', label: '체크', icon: '✅' },
  { to: '/expense',   label: '경비', icon: '💰' },
] as const

export default function BottomTabBar() {
  return (
    <nav className="flex border-t border-gray-200 bg-white">
      {TABS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center py-2 gap-0.5 text-xs min-h-[56px] justify-center ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`
          }
        >
          <span className="text-xl leading-none">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
