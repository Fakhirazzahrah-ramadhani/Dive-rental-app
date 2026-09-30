'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '../cart-context'

function daysBetween(start: string, end: string) {
  const d1 = new Date(start)
  const d2 = new Date(end)
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export default function CartPage() {
  const router = useRouter()
    const { items, updateQuantity, removeItem, clearCart } = useCart()

  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const days = startDate && endDate ? daysBetween(startDate, endDate) : 0
  const subtotal = items.reduce((sum, i) => sum + i.pricePerDay * i.quantity * days, 0)

  async function handleCheckout() {
    setError(null)
    if (items.length === 0) {
      setError('Keranjang masih kosong.')
      return
    }
    if (!startDate || !endDate || days <= 0) {
      setError('Pilih tanggal mulai dan selesai yang valid.')
      return
    }

    setSubmitting(true)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate,
        endDate,
        items: items.map((i) => ({ equipmentId: i.equipmentId, quantity: i.quantity })),
      }),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.message ?? 'Terjadi kesalahan, coba lagi.')
      return
    }

    clearCart()
    router.push(`/booking/${data.bookingId}`)
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← Kembali ke katalog
        </Link>
        <h1 className="mb-6 mt-3 text-2xl font-semibold text-zinc-900 dark:text-white">Keranjang Sewa</h1>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            Keranjang masih kosong.{' '}
            <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">Cari alat</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {items.map((item) => (
                <div key={item.equipmentId} className="flex items-center justify-between gap-4 border-b border-zinc-100 p-4 last:border-0 dark:border-zinc-800">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{item.name}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {item.categoryName} · Rp{item.pricePerDay.toLocaleString('id-ID')}/hari
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={item.maxAvailable}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.equipmentId, Number(e.target.value))}
                      className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-center text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                    <button
                      onClick={() => removeItem(item.equipmentId)}
                      className="text-sm text-red-600 hover:underline dark:text-red-400"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Tanggal Sewa</h2>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-xs text-zinc-500">Mulai</label>
                  <input
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-xs text-zinc-500">Selesai</label>
                  <input
                    type="date"
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
              {days > 0 && <p className="mt-2 text-sm text-zinc-500">{days} hari sewa</p>}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center justify-between text-lg font-semibold text-zinc-900 dark:text-white">
                <span>Perkiraan Total</span>
                <span>Rp{subtotal.toLocaleString('id-ID')}</span>
              </div>
              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Lanjut ke Konfirmasi'}
              </button>
              <p className="mt-2 text-xs text-zinc-400">
                Total final ditentukan sistem saat konfirmasi, sesuai ketersediaan alat di tanggal yang dipilih.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}