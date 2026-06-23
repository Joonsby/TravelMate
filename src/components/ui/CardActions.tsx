// 카드 항목의 수정/삭제 버튼 공통 컴포넌트
import { ConfirmDialog } from './ConfirmDialog'

interface CardActionsProps {
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
  deleteTitle?: string
  deleteDescription?: string
}

export function CardActions({
  onEdit,
  onDelete,
  isDeleting = false,
  deleteTitle = '삭제',
  deleteDescription = '삭제하시겠습니까? 삭제 후 복구할 수 없습니다.',
}: CardActionsProps) {
  return (
    <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onEdit}
        className="flex-1 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-500 text-sm font-medium active:bg-blue-100"
      >
        수정
      </button>
      <ConfirmDialog
        title={deleteTitle}
        description={deleteDescription}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={onDelete}
        disabled={isDeleting}
        trigger={
          <button
            disabled={isDeleting}
            className="flex-1 py-2 rounded-lg bg-red-50 border border-red-200 text-red-400 text-sm font-medium active:bg-red-100 disabled:opacity-50"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        }
      />
    </div>
  )
}
