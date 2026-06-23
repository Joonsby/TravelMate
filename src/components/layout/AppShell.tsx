// 앱 전체 레이아웃 - 상단 헤더(프로필/로그아웃)와 하단 탭바
import { Outlet, useNavigate } from 'react-router-dom'
import BottomTabBar from './BottomTabBar'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { useSelectedTrip } from '../../hooks/useSelectedTrip'

export default function AppShell() {
  const { data: profile } = useProfile()
  const selectedTrip = useSelectedTrip()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col h-svh max-w-md mx-auto bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-sm">
          {profile?.display_name ?? ''}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="text-xs text-blue-500 active:text-blue-700"
          >
            내 프로필 확인
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 active:text-gray-600"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs text-gray-500">
          {selectedTrip ? `📍 ${selectedTrip.title}` : '여행을 선택해주세요'}
        </span>
      </div>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <BottomTabBar />
    </div>
  )
}
