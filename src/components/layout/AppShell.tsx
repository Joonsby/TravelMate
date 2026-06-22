// 앱 전체 레이아웃 - 상단 헤더(프로필/로그아웃)와 하단 탭바
import { Outlet } from 'react-router-dom'
import BottomTabBar from './BottomTabBar'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'

export default function AppShell() {
  const { data: profile } = useProfile()

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col h-svh max-w-md mx-auto bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-sm">
          {profile?.display_name ?? ''}
        </span>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 active:text-gray-600"
        >
          로그아웃
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <BottomTabBar />
    </div>
  )
}
