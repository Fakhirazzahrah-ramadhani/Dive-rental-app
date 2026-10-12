'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import CustomSelect from './custom-select'

type Unit = { id: string; unit_code: string; condition: string; status: string }

const statusOptions = [
  { value: 'tersedia', label: 'Tersedia', dotClass: 'bg-green-500' },
  { value: 'dipesan', label: 'Dipesan', dotClass: 'bg-yellow-500' },
  { value: 'dipakai', label: 'Dipakai', dotClass: 'bg-blue-500' },
  { value: 'servis', label: 'Servis', dotClass: 'bg-red-500' },
]

const statusPillClass: Record<string, string> = {
  tersedia: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  dipesan: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  dipakai: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  servis: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

const conditionOptions = [
  { value: 'baik', label: 'Baik', dotClass: 'bg-green-500' },
  { value: 'perlu perhatian', label: 'Perlu perhatian', dotClass: 'bg-yellow-500' },
  { value: 'rusak', label: 'Rusak', dotClass: 'bg-red-500' },
]

const inputClass =
  'rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-blue-900/40'

export default function UnitsManager({ equipmentId, units }: { equipmentId: string; units: Unit[] }) {
  const router = useRouter()
  const supabase = createClient()

  const [unitCode, setUnitCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.from('equipment_units').insert({
      equipment_id: equipmentId,
      unit_code: unitCode,
    })

    if (error) {
      setMessage(error.message.includes('duplicate') ? 'Kode unit ini sudah dipakai.' : error.message)
    } else {
      setUnitCode('')
      router.refresh()
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setBusyId(id)
    const { error } = await supabase.from('equipment_units').update({ status }).eq('id', id)
    setBusyId(null)
    if (error) alert('Gagal update status: ' + error.message)
    router.refresh()
  }

  async function updateCondition(id: string, condition: string) {
    setBusyId(id)
    const { error } = await supabase.from('equipment_units').update({ condition }).eq('id', id)
    setBusyId(null)
    if (error) alert('Gagal update kondisi: ' + error.message)
    router.refresh()
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Hapus unit "${code}"?`)) return
    setBusyId(id)
    const { error } = await supabase.from('equipment_units').delete().eq('id', id)
    setBusyId(null)
    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-1 min-w-[180px] flex-col">
          <label className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Kode unit baru
          </label>
          <input
            value={unitCode}
            onChange={(e) => setUnitCode(e.target.value)}
            placeholder="Contoh: BCD-001"
            required
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-900 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Tambah Unit'}
        </button>
        {message && <p className="w-full text-sm text-red-600">{message}</p>}
      </form>

      <div className="overflow-visible rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
              <th className="px-5 py-3 font-medium">Kode Unit</th>
              <th className="px-5 py-3 font-medium">Kondisi</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40">
                <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white">{u.unit_code}</td>
                <td className="px-5 py-3">
                  <CustomSelect
                    value={u.condition}
                    options={conditionOptions}
                    onChange={(v) => updateCondition(u.id, v)}
                    disabled={busyId === u.id}
                  />
                </td>
                <td className="px-5 py-3">
                  <CustomSelect
                    value={u.status}
                    options={statusOptions}
                    onChange={(v) => updateStatus(u.id, v)}
                    disabled={busyId === u.id}
                    pillClassName={statusPillClass[u.status]}
                  />
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleDelete(u.id, u.unit_code)}
                    disabled={busyId === u.id}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-sm text-zinc-400">Belum ada unit untuk alat ini.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}