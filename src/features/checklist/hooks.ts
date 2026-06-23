// trip_checklist_items TanStack Query 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from './api'
import type { UpdateChecklistItemInput, DeleteChecklistItemInput } from './types'

export function useChecklistItems(tripId: string | null) {
  return useQuery({
    queryKey: ['checklist_items', tripId],
    queryFn: () => fetchChecklistItems(tripId!),
    enabled: !!tripId,
  })
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createChecklistItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['checklist_items', data.trip_id] })
    },
  })
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateChecklistItemInput) => updateChecklistItem(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['checklist_items', data.trip_id] })
    },
  })
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DeleteChecklistItemInput) => deleteChecklistItem(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checklist_items', variables.trip_id] })
    },
  })
}
