// 일정 탭 — selectedTripId 기준 itinerary_items 조회/생성/수정/삭제, 여행 선택 흐름 포함
import { useState, useEffect, useRef } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useSelectedTrip } from '../../hooks/useSelectedTrip'
import { useItineraryItems, useCreateItineraryItem, useUpdateItineraryItem, useDeleteItineraryItem } from './hooks'
import type { ItineraryItem } from './types'
import TripsPage from '../trips/TripsPage'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { inputClass, dateInputClass } from '../../lib/inputStyles'

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

export default function ItineraryPage() {
  const selectedTripId = useTripStore((s) => s.selectedTripId)
  const selectedTrip = useSelectedTrip()

  const [view, setView] = useState<'items' | 'trips'>('items')

  const prevTripIdRef = useRef(selectedTripId)
  useEffect(() => {
    if (selectedTripId !== prevTripIdRef.current) {
      if (selectedTripId) setView('items')
      prevTripIdRef.current = selectedTripId
    }
  }, [selectedTripId])

  if (view === 'trips') {
    return (
      <div>
        {selectedTripId && (
          <div className="px-4 pt-3">
            <button
              onClick={() => setView('items')}
              className="text-xs text-blue-500 active:text-blue-700"
            >
              ← 일정으로 돌아가기
            </button>
          </div>
        )}
        <TripsPage />
      </div>
    )
  }

  if (!selectedTripId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 px-4">
        <span className="text-4xl">🗓</span>
        <p className="text-gray-700 text-sm font-medium text-center">여행을 먼저 선택해주세요.</p>
        <p className="text-gray-400 text-xs text-center">
          여행을 선택하면 해당 여행의 일정을 관리할 수 있습니다.
        </p>
        <button
          onClick={() => setView('trips')}
          className="mt-1 px-5 py-2 bg-blue-500 text-white text-sm rounded-lg active:bg-blue-600"
        >
          여행 선택하러 가기
        </button>
      </div>
    )
  }

  return (
    <ItineraryItemsView
      tripId={selectedTripId}
      tripTitle={selectedTrip?.title ?? ''}
      tripStartDate={selectedTrip?.start_date ?? null}
      tripEndDate={selectedTrip?.end_date ?? null}
      onChangeTrip={() => setView('trips')}
    />
  )
}

function ItineraryItemsView({
  tripId,
  tripTitle,
  tripStartDate,
  tripEndDate,
  onChangeTrip,
}: {
  tripId: string
  tripTitle: string
  tripStartDate: string | null
  tripEndDate: string | null
  onChangeTrip: () => void
}) {
  const { data: items, isLoading, error } = useItineraryItems(tripId)
  const { mutate: createItem, isPending } = useCreateItineraryItem()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [dayDate, setDayDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [location, setLocation] = useState('')
  const [memo, setMemo] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dayDate) {
      setCreateError('날짜를 선택해주세요.')
      return
    }
    setCreateError(null)

    createItem(
      {
        trip_id: tripId,
        title,
        day_date: dayDate,
        ...(startTime && { start_time: startTime }),
        ...(location && { location }),
        ...(memo && { memo }),
      },
      {
        onSuccess: () => {
          setTitle('')
          setDayDate('')
          setStartTime('')
          setLocation('')
          setMemo('')
          setShowForm(false)
        },
        onError: (err) => {
          setCreateError(err.message)
        },
      }
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400">현재 여행</p>
          <p className="font-semibold text-base">{tripTitle}</p>
        </div>
        <button
          onClick={onChangeTrip}
          className="text-xs text-blue-500 active:text-blue-700 pt-0.5"
        >
          여행 변경
        </button>
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <h2 className="font-semibold text-sm text-gray-700">일정</h2>
        <button
          onClick={() => { setShowForm((v) => !v); setCreateError(null) }}
          className="text-xs text-blue-500 active:text-blue-700"
        >
          {showForm ? '취소' : '+ 일정 추가'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
          <div>
            <label className="block text-xs text-gray-500 mb-1">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="예: 도톤보리 저녁 식사"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">날짜 *</label>
              <input
                type="date"
                value={dayDate}
                onChange={(e) => setDayDate(e.target.value)}
                min={tripStartDate ?? undefined}
                max={tripEndDate ?? undefined}
                className={dateInputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">시간 (선택)</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              >
                <option value="">시간 선택 안함</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">장소 (선택)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
              placeholder="예: 도톤보리"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">메모 (선택)</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white resize-none"
              rows={2}
              placeholder="예약 정보, 주의사항 등"
            />
          </div>

          {createError && (
            <p className="text-red-500 text-xs font-mono">{createError}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-500 text-white text-sm rounded py-1.5 disabled:opacity-50 active:bg-blue-600"
          >
            {isPending ? '추가 중...' : '일정 추가'}
          </button>
        </form>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <span className="text-gray-400 text-sm">일정 불러오는 중...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm font-medium">조회 실패</p>
          <p className="text-red-500 text-xs mt-1 font-mono">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && items?.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-10">
          아직 일정이 없습니다.<br />
          <span className="text-xs">+ 일정 추가 버튼으로 추가해보세요.</span>
        </p>
      )}

      {!isLoading && !error && items && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <ItineraryCard
              key={item.id}
              item={item}
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ItineraryCard({
  item,
  tripStartDate,
  tripEndDate,
}: {
  item: ItineraryItem
  tripStartDate: string | null
  tripEndDate: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [dayDate, setDayDate] = useState(item.day_date)
  const [startTime, setStartTime] = useState(item.start_time ?? '')
  const [location, setLocation] = useState(item.location ?? '')
  const [memo, setMemo] = useState(item.memo ?? '')

  const { mutate: updateItem, isPending: isUpdating } = useUpdateItineraryItem()
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItineraryItem()

  function openEdit() {
    setTitle(item.title)
    setDayDate(item.day_date)
    setStartTime(item.start_time ?? '')
    setLocation(item.location ?? '')
    setMemo(item.memo ?? '')
    setEditing(true)
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    updateItem(
      {
        id: item.id,
        trip_id: item.trip_id,
        title,
        day_date: dayDate,
        start_time: startTime || null,
        location: location || null,
        memo: memo || null,
      },
      { onSuccess: () => setEditing(false) }
    )
  }

  if (editing) {
    return (
      <li className="border border-blue-300 rounded-lg p-3 bg-blue-50">
        <form onSubmit={handleUpdate} className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">날짜 *</label>
              <input
                type="date"
                value={dayDate}
                onChange={(e) => setDayDate(e.target.value)}
                min={tripStartDate ?? undefined}
                max={tripEndDate ?? undefined}
                className={dateInputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">시간</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}                
              >
                <option value="">시간 선택 안함</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">장소</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 bg-blue-500 text-white text-xs rounded py-1.5 disabled:opacity-50 active:bg-blue-600"
            >
              {isUpdating ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 bg-gray-100 text-gray-600 text-xs rounded py-1.5 active:bg-gray-200"
            >
              취소
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="border border-gray-200 rounded-lg p-3 bg-white space-y-1">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm">{item.title}</p>
        {item.start_time && (
          <span className="text-xs text-gray-400 whitespace-nowrap">{item.start_time.slice(0, 5)}</span>
        )}
      </div>
      <p className="text-xs text-gray-400">{item.day_date}</p>
      {item.location && (
        <p className="text-xs text-gray-500">📍 {item.location}</p>
      )}
      {item.memo && (
        <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{item.memo}</p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          onClick={openEdit}
          className="text-xs text-blue-500 active:text-blue-700"
        >
          수정
        </button>
        <ConfirmDialog
          title="일정 삭제"
          description="이 일정을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다."
          confirmText="삭제"
          cancelText="취소"
          onConfirm={() => deleteItem({ id: item.id, trip_id: item.trip_id })}
          disabled={isDeleting}
          trigger={
            <button
              disabled={isDeleting}
              className="text-xs text-red-400 active:text-red-600 disabled:opacity-50"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          }
        />
      </div>
    </li>
  )
}
