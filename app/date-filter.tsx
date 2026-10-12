'use client'

import { useSyncExternalStore } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CalendarDays } from 'lucide-react'

function subscribe() {
  return () => {}
}

function getLocalToday() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export default function DateFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const start = searchParams.get('start') ?? ''
  const end = searchParams.get('end') ?? ''
  // string kosong di server, tanggal lokal di browser (tanpa setState di effect)
  const today = useSyncExternalStore(subscribe, getLocalToday, () => '')

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)

    // kalau tanggal mulai digeser melewati tanggal selesai, kosongkan tanggal selesai
    if (key === 'start' && value && end && value > end) params.delete('end')

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <section
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
      aria-label="Pilih tanggal sewa"
    >
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="size-4 text-blue-700" aria-hidden="true" />
        <h2 className="text-sm font-bold text-zinc-900">Periode sewa</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="rental-start" className="text-xs font-semibold text-zinc-600">
            Tanggal mulai
          </label>
          <input
            id="rental-start"
            type="date"
            min={today}
            value={start}
            onChange={(e) => updateParam('start', e.target.value)}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="rental-end" className="text-xs font-semibold text-zinc-600">
            Tanggal selesai
          </label>
          <input
            id="rental-end"
            type="date"
            min={start || today}
            value={end}
            onChange={(e) => updateParam('end', e.target.value)}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
          />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-500" aria-live="polite">
        {start && end
          ? 'Ketersediaan di bawah sudah sesuai tanggal ini'
          : 'Pilih tanggal untuk melihat ketersediaan alat yang sebenarnya'}
      </p>
    </section>
  )
}