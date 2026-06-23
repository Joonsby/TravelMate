// 로그인 사용자 프로필 조회 검증 화면 (RLS 동작 확인용)
import { useProfile } from '../../hooks/useProfile'
import { useAuthStore } from '../../store/authStore'

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile()
  const user = useAuthStore((s) => s.user)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <span className="text-gray-400 text-sm">프로필 조회 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm font-medium">조회 실패</p>
          <p className="text-red-500 text-xs mt-1 font-mono">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-semibold text-base">내 프로필</h2>

      <section className="space-y-2">
        <Row label="display_name" value={profile?.display_name} />
        <Row label="couple_id"    value={profile?.couple_id} />
        <Row label="avatar_url"   value={profile?.avatar_url ?? '(없음)'} />
        <Row label="created_at"   value={profile?.created_at} />
      </section>

      <hr className="border-gray-100" />

      <section className="space-y-2">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Auth 정보</p>
        <Row label="auth.user.id"    value={user?.id} />
        <Row label="auth.user.email" value={user?.email} />
        <Row label="일치 여부"        value={user?.id === profile?.id ? '✓ profile.id = auth.user.id' : '✗ 불일치'} />
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border-b border-gray-100 pb-2">
      <span className="text-xs text-gray-400 block mb-0.5">{label}</span>
      <span className="text-sm font-mono break-all text-gray-800">{value ?? '-'}</span>
    </div>
  )
}
