// 선택된 여행 ID를 전역으로 관리하는 Zustand 스토어 (localStorage 영속)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TripState {
  selectedTripId: string | null
  setSelectedTripId: (id: string | null) => void
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      selectedTripId: null,
      setSelectedTripId: (id) => set({ selectedTripId: id }),
    }),
    { name: 'trip-store' }
  )
)
