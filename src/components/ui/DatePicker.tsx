// 날짜 선택 공통 컴포넌트 — react-day-picker 기반, 여행 기간 범위 제한 지원
import { useState } from 'react'
import { DayPicker, type Matcher } from 'react-day-picker'
import 'react-day-picker/style.css'

interface DatePickerProps {
  value: string       // YYYY-MM-DD, 빈 문자열이면 미선택
  onChange: (value: string) => void
  minDate?: string    // YYYY-MM-DD, 이 날짜 이전 비활성화
  maxDate?: string    // YYYY-MM-DD, 이 날짜 이후 비활성화
  placeholder?: string
}

// 'YYYY-MM-DD' → 로컬 Date (UTC 변환 방지)
function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// 로컬 Date → 'YYYY-MM-DD'
function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function DatePicker({ value, onChange, minDate, maxDate, placeholder = '날짜 선택' }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selected = value ? parseLocalDate(value) : undefined
  const defaultMonth = selected ?? (minDate ? parseLocalDate(minDate) : new Date())

  const disabled: Matcher[] = []
  if (minDate) disabled.push({ before: parseLocalDate(minDate) })
  if (maxDate) disabled.push({ after: parseLocalDate(maxDate) })

  function handleSelect(date: Date | undefined) {
    if (!date) return
    onChange(formatLocalDate(date))
    setOpen(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-left ${
          value ? 'text-gray-900' : 'text-gray-400'
        }`}
      >
        {value || placeholder}
      </button>

      {open && (
        <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-md overflow-hidden">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={defaultMonth}
            disabled={disabled.length > 0 ? disabled : undefined}
          />
        </div>
      )}
    </div>
  )
}
