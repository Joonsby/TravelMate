// selectedTripId에 해당하는 Trip 전체 객체를 반환하는 훅
import { useTripStore } from '../store/tripStore'
import { useTrips } from './useTrips'
import type { Trip } from '../features/trips/types'

export function useSelectedTrip(): Trip | null {
  const selectedTripId = useTripStore((s) => s.selectedTripId)
  const { data: trips } = useTrips()

  if (!selectedTripId || !trips) return null
  return trips.find((t) => t.id === selectedTripId) ?? null
}
