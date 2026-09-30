'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Category = { id: string; name: string }

const inputClass =
  'rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-blue-900/40'
const labelClass = 'mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300'

export default function AddEquipmentForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const supabase = createClient()

  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.from('equipment').insert({
      category_id: categoryId,
      name,
      brand,
      size,
      price_per_day: Number(price),
    })

    if (error) {
      setMessage(error.message)
    } else {
      setName(''); setBrand(''); setSize(''); setPrice('')
      router.refresh()
    }
    setLoading(false)
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        Belum ada kategori. Tambahkan dulu di bagian Kategori Alat di atas.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col">
          <label className={labelClass}>Kategori</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>Nama alat</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="BCD Cressi" required className={inputClass} />
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>Merek</label>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Scubapro" className={inputClass} />
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>Ukuran</label>
          <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="M / XL" className={inputClass} />
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>Harga/hari (Rp)</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="150000" required className={inputClass} />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Tambah Alat'}
        </button>
        {message && <p className="text-sm text-red-600">{message}</p>}
      </div>
    </form>
  )
}