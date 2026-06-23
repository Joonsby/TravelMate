// 여행 삭제 후 trips 캐시를 갱신하는 훅
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProfile } from './useProfile'
import { deleteTrip } from '../features/trips/api'

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()

  return useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', profile?.couple_id] })
    },
  })
}
