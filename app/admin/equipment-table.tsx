'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type Category = { id: string; name: string }
type Equipment = {
  id: string
  name: string
  brand: string | null
  size: string | null
  price_per_day: number
  category_id: string
  category_name: string
}

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-black outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white'

export default function EquipmentTable({ equipment, categories }: { equipment: Equipment[]; categories: Category[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Equipment>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  function startEdit(item: Equipment) {
    setEditingId(item.id)
    setForm(item)
  }

  async function saveEdit(id: string) {
    setBusyId(id)
    const { error } = await supabase
      .from('equipment')
      .update({
        category_id: form.category_id,
        name: form.name,
        brand: form.brand,
        size: form.size,
        price_per_day: Number(form.price_per_day),
      })
      .eq('id', id)

    setBusyId(null)
    if (error) {
      alert('Gagal menyimpan: ' + error.message)
      return
    }
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus alat "${name}"? Aksi ini tidak bisa dibatalkan.`)) return
    setBusyId(id)
    const { error } = await supabase.from('equipment').delete().eq('id', id)
    setBusyId(null)
    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }
    router.refresh()
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
            <th className="px-5 py-3 font-medium">Nama</th>
            <th className="px-5 py-3 font-medium">Kategori</th>
            <th className="px-5 py-3 font-medium">Merek</th>
            <th className="px-5 py-3 font-medium">Ukuran</th>
            <th className="px-5 py-3 font-medium">Harga/hari</th>
            <th className="px-5 py-3 font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((item) => {
            const isEditing = editingId === item.id
            const isBusy = busyId === item.id

            if (isEditing) {
              return (
                <tr key={item.id} className="border-b border-zinc-100 bg-blue-50/60 dark:border-zinc-800 dark:bg-blue-950/20">
                  <td className="p-3">
                    <input className={inputClass} value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </td>
                  <td className="p-3">
                    <select className={inputClass} value={form.category_id ?? ''} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <input className={inputClass} value={form.brand ?? ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                  </td>
                  <td className="p-3">
                    <input className={inputClass} value={form.size ?? ''} onChange={(e) => setForm({ ...form, size: e.target.value })} />
                  </td>
                  <td className="p-3">
                    <input className={inputClass} type="number" value={form.price_per_day ?? 0} onChange={(e) => setForm({ ...form, price_per_day: Number(e.target.value) })} />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <button onClick={() => saveEdit(item.id)} disabled={isBusy} className="mr-2 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                      Simpan
                    </button>
                    <button onClick={() => setEditingId(null)} className="rounded-md bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200">
                      Batal
                    </button>
                  </td>
                </tr>
              )
            }

            return (
              <tr key={item.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40">
                <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white">{item.name}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {item.category_name}
                  </span>
                </td>
                <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{item.brand || '-'}</td>
                <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{item.size || '-'}</td>
                <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white">Rp{Number(item.price_per_day).toLocaleString('id-ID')}</td>
                                <td className="px-5 py-3 whitespace-nowrap">
                  <Link href={`/admin/alat/${item.id}`} className="mr-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
                    Kelola Unit
                  </Link>
                  <button onClick={() => startEdit(item)} className="mr-2 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item.id, item.name)} disabled={isBusy} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40">
                    Hapus
                  </button>
                </td>
              </tr>
            )
          })}
          {equipment.length === 0 && (
            <tr><td colSpan={6} className="p-8 text-center text-sm text-zinc-400">Belum ada alat.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}