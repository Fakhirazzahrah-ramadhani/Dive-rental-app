import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import BookingCountdown from './countdown'
import PayButton from './pay-button'

const statusLabel: Record<string, { label: string; className: string }> = {
  menunggu_pembayaran: { label: 'Menunggu Pembayaran', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
  dikonfirmasi: { label: 'Dikonfirmasi', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  aktif: { label: 'Aktif', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  selesai: { label: 'Selesai', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  dibatalkan: { label: 'Dibatalkan', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
        .select('id, start_date, end_date, status, total_price, deposit_amount, expires_at, created_at')
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const { data: rawItems } = await supabase
    .from('booking_items')
    .select('id, equipment_units(unit_code, equipment(name, price_per_day, equipment_categories(name)))')
    .eq('booking_id', id)

  const items = (rawItems ?? []).map((row) => {
    const unit = row.equipment_units as unknown as {
      unit_code: string
      equipment: { name: string; price_per_day: number; equipment_categories: { name: string } | null } | null
    } | null
    return {
      id: row.id,
      unitCode: unit?.unit_code ?? '-',
      equipmentName: unit?.equipment?.name ?? '-',
      categoryName: unit?.equipment?.equipment_categories?.name ?? '-',
      pricePerDay: unit?.equipment?.price_per_day ?? 0,
    }
  })

  const status = statusLabel[booking.status] ?? { label: booking.status, className: 'bg-zinc-100 text-zinc-700' }
  const days = Math.round(
    (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← Kembali ke katalog
        </Link>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Booking
              </p>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
                #{booking.id.slice(0, 8)}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                {status.label}
              </span>
              {booking.status === 'menunggu_pembayaran' && (
                <BookingCountdown expiresAt={booking.expires_at as string | null} />
              )}
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-4 border-b border-zinc-100 pb-5 text-sm dark:border-zinc-800">
            <div>
              <p className="text-zinc-400">Tanggal Sewa</p>
              <p className="font-medium text-zinc-900 dark:text-white">
                {new Date(booking.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
                {new Date(booking.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-zinc-400">Durasi</p>
              <p className="font-medium text-zinc-900 dark:text-white">{days} hari</p>
            </div>
          </div>

          <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Alat yang Disewa</h2>
          <div className="mb-5 flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-800/50">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">{item.equipmentName}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.categoryName} · Unit {item.unitCode}</p>
                </div>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">
                  Rp{Number(item.pricePerDay).toLocaleString('id-ID')}/hari
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <span className="text-base font-semibold text-zinc-900 dark:text-white">Total</span>
            <span className="text-xl font-semibold text-zinc-900 dark:text-white">
              Rp{Number(booking.total_price).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

            {booking.status === 'menunggu_pembayaran' && (
          <div className="mt-4">
            <PayButton bookingId={booking.id} />
          </div>
        )}
      </div>
    </div>
  )
}