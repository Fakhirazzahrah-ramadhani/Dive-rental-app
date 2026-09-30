'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Category = { id: string; name: string }

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.from('equipment_categories').insert({ name })

    if (error) {
      setMessage(error.message.includes('duplicate') ? 'Kategori ini sudah ada.' : error.message)
    } else {
      setName('')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus kategori "${name}"? Ini akan gagal kalau masih ada alat yang memakai kategori ini.`)) return
    setBusyId(id)
    const { error } = await supabase.from('equipment_categories').delete().eq('id', id)
    setBusyId(null)
    if (error) {
      alert('Gagal menghapus: kategori ini masih dipakai oleh alat tertentu. Pindahkan dulu alatnya ke kategori lain.')
      return
    }
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 min-w-[200px] flex-col">
          <label className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nama kategori baru
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Snorkel Set"
            required
            className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-blue-900/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Tambah Kategori'}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        {categories.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {c.name}
            <button
              onClick={() => handleDelete(c.id, c.name)}
              disabled={busyId === c.id}
              className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/40"
              title="Hapus kategori"
            >
              ✕
            </button>
          </span>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-zinc-400">Belum ada kategori.</p>
        )}
      </div>
    </div>
  )
}