// 여행 목록 조회/생성/선택 화면
import { useState } from 'react'
import { useTrips } from '../../hooks/useTrips'
import { useCreateTrip } from '../../hooks/useCreateTrip'
import { useTripStore } from '../../store/tripStore'
import type { Trip } from './types'

export default function TripsPage() {
  const { data: trips, isLoading, error } = useTrips()
  const { mutate: createTrip, isPending } = useCreateTrip()
  const selectedTripId = useTripStore((s) => s.selectedTripId)
  const setSelectedTripId = useTripStore((s) => s.setSelectedTripId)

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    createTrip(
      { title, start_date: startDate, end_date: endDate },
      {
        onSuccess: (newTrip) => {
          setSelectedTripId(newTrip.id)
          setTitle('')
          setStartDate('')
          setEndDate('')
          setShowForm(false)
        },
        onError: (err) => {
          setCreateError(err.message)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-400 text-sm">여행 목록 불러오는 중...</span>
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
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">여행 목록</h2>
        <button
          onClick={() => { setShowForm((v) => !v); setCreateError(null) }}
          className="text-xs text-blue-500 active:text-blue-700"
        >
          {showForm ? '취소' : '+ 새 여행'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
          <div>
            <label className="block text-xs text-gray-500 mb-1">여행 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
              placeholder="예: 오사카 여름 여행"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
                required
              />
            </div>
          </div>

          {createError && (
            <p className="text-red-500 text-xs font-mono">{createError}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-500 text-white text-sm rounded py-1.5 disabled:opacity-50 active:bg-blue-600"
          >
            {isPending ? '생성 중...' : '여행 만들기'}
          </button>
        </form>
      )}

      {trips?.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-10">
          아직 여행이 없습니다.<br />
          <span className="text-xs">+ 새 여행 버튼으로 추가해보세요.</span>
        </p>
      )}

      <ul className="space-y-2">
        {trips?.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            isSelected={selectedTripId === trip.id}
            onSelect={setSelectedTripId}
          />
        ))}
      </ul>
    </div>
  )
}

function TripCard({
  trip,
  isSelected,
  onSelect,
}: {
  trip: Trip
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <li
      onClick={() => onSelect(trip.id)}
      className={`border rounded-lg p-3 space-y-1 cursor-pointer active:opacity-70 transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`font-medium text-sm ${isSelected ? 'text-blue-700' : ''}`}>{trip.title}</p>
        {isSelected && (
          <span className="bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            ✓ 선택됨
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400">
        {trip.start_date ?? '-'} ~ {trip.end_date ?? '-'}
      </p>
      {trip.destination && (
        <p className="text-xs text-gray-500">{trip.destination}</p>
      )}
    </li>
  )
}
