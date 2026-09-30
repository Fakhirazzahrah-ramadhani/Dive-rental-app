'use client'

import { useEffect, useState } from 'react'

export default function BookingCountdown({ expiresAt }: { expiresAt: string | null }) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!expiresAt) return
    const target = new Date(expiresAt).getTime()

    function tick() {
      setRemaining(Math.max(0, target - Date.now()))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  if (remaining === null) return null

  if (remaining === 0) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
        Kedaluwarsa
      </span>
    )
  }

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return (
    <span className="whitespace-nowrap text-xs font-medium text-zinc-500 dark:text-zinc-400">
      Sisa {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  )
}