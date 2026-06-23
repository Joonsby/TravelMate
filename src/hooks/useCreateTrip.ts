// 새 여행을 생성하고 trips 캐시를 갱신하는 훅
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProfile } from './useProfile'
import { createTrip } from '../features/trips/api'
import type { CreateTripInput } from '../features/trips/types'

type TripFormInput = Omit<CreateTripInput, 'couple_id'>

export function useCreateTrip() {
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()

  return useMutation({
    mutationFn: (input: TripFormInput) =>
      createTrip({ ...input, couple_id: profile!.couple_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', profile?.couple_id] })
    },
  })
}
