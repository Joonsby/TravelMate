// 여행별 준비물 체크리스트 조회/추가/완료/수정/삭제
import { useState } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useSelectedTrip } from '../../hooks/useSelectedTrip'
import { useChecklistItems, useCreateChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem } from './hooks'
import type { TripChecklistItem } from './types'
import { CardActions } from '../../components/ui/CardActions'
import { inputClass } from '../../lib/inputStyles'

export default function ChecklistPage() {
  const selectedTripId = useTripStore((s) => s.selectedTripId)
  const selectedTrip = useSelectedTrip()

  if (!selectedTripId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 px-4">
        <span className="text-4xl">✅</span>
        <p className="text-gray-700 text-sm font-medium text-center">여행을 먼저 선택해주세요.</p>
        <p className="text-gray-400 text-xs text-center">
          일정 탭에서 여행을 선택하면 체크리스트를 관리할 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <ChecklistView
      tripId={selectedTripId}
      tripTitle={selectedTrip?.title ?? ''}
    />
  )
}

function ChecklistView({ tripId, tripTitle }: { tripId: string; tripTitle: string }) {
  const { data: items, isLoading, error } = useChecklistItems(tripId)
  const { mutate: createItem, isPending } = useCreateChecklistItem()

  const [content, setContent] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!content.trim()) return
    setCreateError(null)
    createItem(
      { trip_id: tripId, content: content.trim() },
      {
        onSuccess: () => setContent(''),
        onError: (err) => setCreateError(err.message),
      }
    )
  }

  const uncompleted = items?.filter((i) => !i.is_completed) ?? []
  const completed = items?.filter((i) => i.is_completed) ?? []

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs text-gray-400">현재 여행</p>
        <p className="font-semibold text-base">{tripTitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="준비물 입력"
          className="flex-1 h-10 border border-gray-300 rounded px-3 text-sm bg-white"
        />
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="px-4 h-10 bg-blue-500 text-white text-sm rounded disabled:opacity-50 active:bg-blue-600 shrink-0"
        >
          추가
        </button>
      </form>

      {createError && (
        <p className="text-red-500 text-xs font-mono">{createError}</p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <span className="text-gray-400 text-sm">불러오는 중...</span>
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
          아직 준비물이 없습니다.<br />
          <span className="text-xs">위에서 추가해보세요.</span>
        </p>
      )}

      {!isLoading && !error && items && items.length > 0 && (
        <div className="space-y-4">
          {uncompleted.length > 0 && (
            <ul className="space-y-2">
              {uncompleted.map((item) => (
                <ChecklistItemCard key={item.id} item={item} />
              ))}
            </ul>
          )}

          {completed.length > 0 && (
            <div className="space-y-2">
              <div className={`flex items-center gap-2 ${uncompleted.length > 0 ? 'border-t border-gray-100 pt-3' : ''}`}>
                <p className="text-xs text-gray-400">완료 ({completed.length})</p>
              </div>
              <ul className="space-y-2">
                {completed.map((item) => (
                  <ChecklistItemCard key={item.id} item={item} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChecklistItemCard({ item }: { item: TripChecklistItem }) {
  const { mutate: updateItem, isPending: isUpdating } = useUpdateChecklistItem()
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteChecklistItem()

  const [editing, setEditing] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [editContent, setEditContent] = useState(item.content)

  function handleToggle() {
    updateItem({ id: item.id, trip_id: item.trip_id, is_completed: !item.is_completed })
  }

  function openEdit() {
    setEditContent(item.content)
    setShowActions(false)
    setEditing(true)
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editContent.trim()) return
    updateItem(
      { id: item.id, trip_id: item.trip_id, content: editContent.trim() },
      { onSuccess: () => setEditing(false) }
    )
  }

  if (editing) {
    return (
      <li className="border border-blue-300 rounded-lg p-3 bg-blue-50">
        <form onSubmit={handleUpdate} className="flex gap-2">
          <input
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 h-10 border border-gray-300 rounded px-3 text-sm bg-white"
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={isUpdating}
            className="px-3 h-10 bg-blue-500 text-white text-xs rounded disabled:opacity-50 active:bg-blue-600 shrink-0"
          >
            {isUpdating ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-3 h-10 bg-gray-100 text-gray-600 text-xs rounded active:bg-gray-200 shrink-0"
          >
            취소
          </button>
        </form>
      </li>
    )
  }

  return (
    <li className={`border rounded-lg p-3 bg-white ${item.is_completed ? 'border-gray-100' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          disabled={isUpdating}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 disabled:opacity-50"
          aria-label={item.is_completed ? '완료 취소' : '완료'}
        >
          <span className="text-xl leading-none">
            {item.is_completed ? '☑' : '☐'}
          </span>
        </button>
        <span
          className={`flex-1 text-sm leading-snug ${
            item.is_completed ? 'line-through text-gray-400' : 'text-gray-800'
          }`}
        >
          {item.content}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setShowActions((v) => !v) }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 text-lg rounded-lg active:bg-gray-100 active:text-gray-600 shrink-0"
          aria-label="관리"
        >
          ⋯
        </button>
      </div>
      {showActions && (
        <CardActions
          onEdit={openEdit}
          onDelete={() => deleteItem({ id: item.id, trip_id: item.trip_id })}
          isDeleting={isDeleting}
          deleteTitle="항목 삭제"
          deleteDescription="이 항목을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다."
          editVariant="gray"
        />
      )}
    </li>
  )
}
