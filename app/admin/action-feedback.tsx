'use client'

import { X } from 'lucide-react'

export type AdminFeedback = {
  kind: 'success' | 'error'
  message: string
}

export default function AdminActionFeedback({
  feedback,
  onDismiss,
}: {
  feedback: AdminFeedback | null
  onDismiss: () => void
}) {
  if (!feedback) return null

  const isError = feedback.kind === 'error'

  return (
    <div
      className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${
        isError
          ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
          : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200'
      }`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <p className="min-w-0 wrap-break-word">{feedback.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup pesan"
        className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-md opacity-70 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}