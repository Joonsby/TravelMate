// 현재 로그인한 사용자의 profiles 행을 React Query로 조회하는 훅
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { fetchMyProfile } from '../features/profile/api'
import type { Profile } from '../features/profile/types'

export function useProfile() {
  const user = useAuthStore((s) => s.user)

  return useQuery<Profile>({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchMyProfile(user!.id),
    enabled: !!user,
  })
}
