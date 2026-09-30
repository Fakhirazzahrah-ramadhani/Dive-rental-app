'use client'

import { useEffect, useRef, useState } from 'react'

type Option = { value: string; label: string; dotClass?: string }

export default function CustomSelect({
  value,
  options,
  onChange,
  disabled,
  pillClassName,
}: {
  value: string
  options: Option[]
  onChange: (value: string) => void
  disabled?: boolean
  pillClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${pillClassName ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
      >
        {current?.dotClass && <span className={`h-1.5 w-1.5 rounded-full ${current.dotClass}`} />}
        {current?.label ?? value}
        <svg width="10" height="10" viewBox="0 0 12 12" className="opacity-60">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1.5 min-w-[150px] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 ${
                o.value === value ? 'font-medium text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {o.dotClass && <span className={`h-1.5 w-1.5 rounded-full ${o.dotClass}`} />}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}