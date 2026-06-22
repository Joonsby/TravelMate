// 비로그인 상태일 때 /login으로 리다이렉트하는 보호 라우트
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-svh">
        <span className="text-gray-400 text-sm">로딩 중...</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
