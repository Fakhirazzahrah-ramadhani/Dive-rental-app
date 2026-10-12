'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useCart } from '../cart-context'

function daysBetween(start: string, end: string) {
  const d1 = new Date(start)
  const d2 = new Date(end)
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export default function CartClientPage({
  initialStartDate,
  initialEndDate,
}: {
  initialStartDate: string
  initialEndDate: string
}) {
  const router = useRouter()
  const { items, updateQuantity, removeItem, clearCart } = useCart()

  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
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
    <div className="min-h-screen bg-[#f4f8fc] px-4 py-7 sm:px-6 sm:py-9">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-800 hover:text-blue-950">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke katalog
        </Link>
        <header className="mb-6 mt-5 border-b border-zinc-200 pb-5">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-800">Pesanan Anda</p>
          <h1 className="font-(family-name:--font-heading) text-2xl font-extrabold tracking-tight text-zinc-950">Keranjang sewa</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Periksa perlengkapan dan periode sewa sebelum melanjutkan.</p>
        </header>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
            Keranjang masih kosong.{' '}
            <Link href="/" className="font-semibold text-blue-800 hover:underline">Cari alat</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <section aria-label="Daftar perlengkapan" className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              {items.map((item) => (
                <div key={item.equipmentId} className="flex items-center justify-between gap-3 border-b border-zinc-100 p-4 last:border-0 sm:gap-4">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-zinc-900">{item.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {item.categoryName} · Rp{item.pricePerDay.toLocaleString('id-ID')}/hari
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <input
                      type="number"
                      min={1}
                      max={item.maxAvailable}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.equipmentId, Number(e.target.value))}
                      className="h-10 w-16 rounded-md border border-zinc-300 bg-white px-2 text-center text-sm text-zinc-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                    />
                    <button
                      onClick={() => removeItem(item.equipmentId)}
                      className="text-sm font-semibold text-rose-700 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
              <h2 className="mb-4 text-sm font-bold text-zinc-900">Periode sewa</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-600" htmlFor="cart-start-date">Tanggal mulai</label>
                  <input
                    id="cart-start-date"
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-600" htmlFor="cart-end-date">Tanggal selesai</label>
                  <input
                    id="cart-end-date"
                    type="date"
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                  />
                </div>
              </div>
              {days > 0 && <p className="mt-3 text-sm text-zinc-500">Durasi sewa: <span className="font-semibold text-zinc-700">{days} hari</span></p>}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 text-lg font-semibold text-zinc-900">
                <span>Perkiraan Total</span>
                <span className="shrink-0 text-blue-900">Rp{subtotal.toLocaleString('id-ID')}</span>
              </div>
              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="min-h-11 w-full rounded-md bg-blue-800 px-4 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Lanjut ke Konfirmasi'}
              </button>
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                Total final ditentukan sistem saat konfirmasi, sesuai ketersediaan alat di tanggal yang dipilih.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}