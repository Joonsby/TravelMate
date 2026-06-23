// 위험 작업 확인 공통 다이얼로그 — @radix-ui/react-alert-dialog 기반
import * as AlertDialog from '@radix-ui/react-alert-dialog'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  trigger: React.ReactNode
  disabled?: boolean
}

export function ConfirmDialog({
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  trigger,
  disabled = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild disabled={disabled}>
        {trigger}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl p-6 w-[calc(100vw-3rem)] max-w-sm shadow-xl">
          <AlertDialog.Title className="font-semibold text-base mb-2">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-gray-500 mb-5">
            {description}
          </AlertDialog.Description>
          <div className="flex gap-2">
            <AlertDialog.Cancel asChild>
              <button className="flex-1 bg-gray-100 text-gray-700 text-sm rounded-lg py-2 active:bg-gray-200">
                {cancelText}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className="flex-1 bg-red-500 text-white text-sm font-medium rounded-lg py-2 active:bg-red-600"
              >
                {confirmText}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
