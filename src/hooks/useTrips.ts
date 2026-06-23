// 현재 커플의 trips 목록을 React Query로 조회하는 훅
import { useQuery } from '@tanstack/react-query'
import { useProfile } from './useProfile'
import { fetchTrips } from '../features/trips/api'
import type { Trip } from '../features/trips/types'

export function useTrips() {
  const { data: profile } = useProfile()

  return useQuery<Trip[]>({
    queryKey: ['trips', profile?.couple_id],
    queryFn: fetchTrips,
    enabled: !!profile?.couple_id,
  })
}
