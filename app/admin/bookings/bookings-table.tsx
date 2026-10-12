'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import CustomSelect from '../alat/[id]/custom-select'
import AdminActionFeedback, { type AdminFeedback } from '../action-feedback'

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
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('id-ID')
  const filteredBookings = normalizedSearch
    ? bookings.filter((booking) => [
      booking.customerName,
      booking.customerPhone,
      booking.id,
      booking.itemsText,
      statusOptions.find((option) => option.value === booking.status)?.label ?? booking.status,
    ].some((value) => value.toLocaleLowerCase('id-ID').includes(normalizedSearch)))
    : bookings

  async function updateStatus(id: string, status: string) {
    setBusyId(id)
    setFeedback(null)
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    setBusyId(null)
    if (error) {
      setFeedback({ kind: 'error', message: `Gagal memperbarui status: ${error.message}` })
      return
    }
    setFeedback({ kind: 'success', message: 'Status booking berhasil diperbarui.' })
    router.refresh()
  }

  function isExpired(b: Booking) {
    return b.status === 'menunggu_pembayaran' && b.expiresAt && new Date(b.expiresAt) < new Date()
  }

  return (
    <>
      <AdminActionFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
        <label htmlFor="booking-search" className="sr-only">Cari nama pelanggan atau booking</label>
        <input
          id="booking-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cari nama pelanggan, telepon, ID, atau alat"
          className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>
      <div className="space-y-3 lg:hidden">
        {filteredBookings.map((booking) => {
          const expired = isExpired(booking)

          return (
            <article key={booking.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="wrap-break-word font-semibold text-zinc-900 dark:text-white">{booking.customerName}</h3>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{booking.customerPhone || 'Nomor telepon tidak tersedia'}</p>
                </div>
                <p className="shrink-0 text-right text-sm font-bold text-zinc-900 dark:text-white">
                  Rp{Number(booking.totalPrice).toLocaleString('id-ID')}
                  <span className="mt-0.5 block text-xs font-normal text-zinc-500">Total</span>
                </p>
              </div>

              <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <p className="mb-1 text-xs font-semibold text-zinc-500">Alat disewa</p>
                <p className="wrap-break-word text-sm leading-5 text-zinc-800 dark:text-zinc-200">{booking.itemsText}</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                <div>
                  <p className="text-xs font-medium text-zinc-500">Mulai</p>
                  <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">
                    {new Date(booking.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">Selesai</p>
                  <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">
                    {new Date(booking.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-500">Status</span>
                {expired ? (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
                    Kedaluwarsa
                  </span>
                ) : (
                  <CustomSelect
                    value={booking.status}
                    options={statusOptions}
                    onChange={(value) => updateStatus(booking.id, value)}
                    disabled={busyId === booking.id}
                    pillClassName={statusPillClass[booking.status]}
                  />
                )}
              </div>
            </article>
          )
        })}
        {filteredBookings.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            {bookings.length === 0 ? 'Belum ada booking.' : 'Tidak ada booking yang cocok.'}
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:block">
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
          {filteredBookings.map((b) => (
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
          {filteredBookings.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-sm text-zinc-400">
                {bookings.length === 0 ? 'Belum ada booking.' : 'Tidak ada booking yang cocok.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </>
  )
}