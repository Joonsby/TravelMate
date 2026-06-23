// 여행 수정 후 trips 캐시를 갱신하는 훅
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProfile } from './useProfile'
import { updateTrip } from '../features/trips/api'
import type { UpdateTripInput } from '../features/trips/types'

export function useUpdateTrip() {
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()

  return useMutation({
    mutationFn: (input: UpdateTripInput) => updateTrip(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', profile?.couple_id] })
    },
  })
}
