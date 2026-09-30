'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import CustomSelect from '../alat/[id]/custom-select'

type Booking = {
  id: string
  customerName: string
  customerPhone: string
  startDate: string
  endDate: string
  status: string
  totalPrice: number
  expiresAt: string | null
  itemsText: string
}

const statusOptions = [
  { value: 'menunggu_pembayaran', label: 'Menunggu Pembayaran', dotClass: 'bg-yellow-500' },
  { value: 'dikonfirmasi', label: 'Dikonfirmasi', dotClass: 'bg-blue-500' },
  { value: 'aktif', label: 'Aktif', dotClass: 'bg-green-500' },
  { value: 'selesai', label: 'Selesai', dotClass: 'bg-zinc-500' },
  { value: 'dibatalkan', label: 'Dibatalkan', dotClass: 'bg-red-500' },
]

const statusPillClass: Record<string, string> = {
  menunggu_pembayaran: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  dikonfirmasi: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  aktif: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  selesai: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  dibatalkan: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

export default function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [busyId, setBusyId] = useState<string | null>(null)

  async function updateStatus(id: string, status: string) {
    setBusyId(id)
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    setBusyId(null)
    if (error) alert('Gagal update status: ' + error.message)
    router.refresh()
  }

  function isExpired(b: Booking) {
    return b.status === 'menunggu_pembayaran' && b.expiresAt && new Date(b.expiresAt) < new Date()
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
            <th className="px-5 py-3 font-medium">Customer</th>
            <th className="px-5 py-3 font-medium">Alat</th>
            <th className="px-5 py-3 font-medium">Tanggal Sewa</th>
            <th className="px-5 py-3 font-medium">Total</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40">
              <td className="px-5 py-3">
                <p className="font-medium text-zinc-900 dark:text-white">{b.customerName}</p>
                <p className="text-xs text-zinc-400">{b.customerPhone}</p>
              </td>
              <td className="max-w-[50] px-5 py-3 text-zinc-600 dark:text-zinc-400">{b.itemsText}</td>
              <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                {new Date(b.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
                {new Date(b.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                Rp{Number(b.totalPrice).toLocaleString('id-ID')}
              </td>
              <td className="px-5 py-3">
                {isExpired(b) ? (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
                    Kedaluwarsa
                  </span>
                ) : (
                  <CustomSelect
                    value={b.status}
                    options={statusOptions}
                    onChange={(v) => updateStatus(b.id, v)}
                    disabled={busyId === b.id}
                    pillClassName={statusPillClass[b.status]}
                  />
                )}
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr><td colSpan={5} className="p-8 text-center text-sm text-zinc-400">Belum ada booking.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}