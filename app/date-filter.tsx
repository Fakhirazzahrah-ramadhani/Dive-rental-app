'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export default function DateFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const start = searchParams.get('start') ?? ''
  const end = searchParams.get('end') ?? ''
  const today = new Date().toISOString().split('T')[0]

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex flex-col">
        <label className="mb-1 text-xs font-medium text-blue-700 dark:text-blue-300">Tanggal Mulai</label>
        <input
          type="date"
          min={today}
          value={start}
          onChange={(e) => updateParam('start', e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs font-medium text-blue-700 dark:text-blue-300">Tanggal Selesai</label>
        <input
          type="date"
          min={start || today}
          value={end}
          onChange={(e) => updateParam('end', e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
      </div>
      <p className="text-xs text-blue-700 dark:text-blue-300">
        {start && end ? 'Ketersediaan di bawah sudah sesuai tanggal ini' : 'Pilih tanggal untuk melihat ketersediaan alat yang sebenarnya'}
      </p>
    </div>
  )
}