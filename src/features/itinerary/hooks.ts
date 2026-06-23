// itinerary_items TanStack Query 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchItineraryItems, createItineraryItem, updateItineraryItem, deleteItineraryItem } from './api'
import type { UpdateItineraryItemInput, DeleteItineraryItemInput } from './types'

export function useItineraryItems(tripId: string | null) {
  return useQuery({
    queryKey: ['itinerary_items', tripId],
    queryFn: () => fetchItineraryItems(tripId!),
    enabled: !!tripId,
  })
}

export function useCreateItineraryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createItineraryItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary_items', data.trip_id] })
    },
  })
}

export function useUpdateItineraryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateItineraryItemInput) => updateItineraryItem(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary_items', data.trip_id] })
    },
  })
}

export function useDeleteItineraryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DeleteItineraryItemInput) => deleteItineraryItem(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary_items', variables.trip_id] })
    },
  })
}
