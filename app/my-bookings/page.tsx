import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const statusLabel: Record<string, { label: string; className: string }> = {
  menunggu_pembayaran: { label: 'Menunggu Pembayaran', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
  dikonfirmasi: { label: 'Dikonfirmasi', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  aktif: { label: 'Aktif', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  selesai: { label: 'Selesai', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  dibatalkan: { label: 'Dibatalkan', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
}

export default async function MyBookingsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawBookings } = await supabase
    .from('bookings')
        .select('id, start_date, end_date, status, total_price, created_at, expires_at, booking_items(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const bookings = rawBookings ?? []

  return (
    <div className="min-h-screen bg-[#f4f8fc] px-4 py-7 sm:px-6 sm:py-9">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-blue-800 hover:underline">
          ← Kembali ke katalog
        </Link>
        <h1 className="mb-6 mt-3 text-2xl font-semibold text-zinc-900 dark:text-white">
          Booking Saya
        </h1>

        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            Kamu belum punya booking.{' '}
            <Link href="/" className="font-semibold text-blue-800 hover:underline">Cari alat sekarang</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
                       {bookings.map((b) => {
              const isExpired =
                b.status === 'menunggu_pembayaran' && b.expires_at && new Date(b.expires_at) < new Date()

              const status = isExpired
                ? { label: 'Kedaluwarsa', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' }
                : statusLabel[b.status] ?? { label: b.status, className: 'bg-zinc-100 text-zinc-700' }

              const itemCount = (b.booking_items as unknown as { id: string }[]).length

              return (
                <Link
                  key={b.id}
                  href={`/booking/${b.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-blue-700/40 sm:p-5"
                >
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <p className="font-medium text-zinc-900 dark:text-white">#{b.id.slice(0, 8)}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(b.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
                      {new Date(b.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{itemCount} alat
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Rp{Number(b.total_price).toLocaleString('id-ID')}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}