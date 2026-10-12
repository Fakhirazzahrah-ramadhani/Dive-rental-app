import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import CatalogGrid from './catalog-grid'
import DateFilter from './date-filter'
import LogoutButton from './logout-button'

const statusLabel: Record<string, { label: string; className: string }> = {
  menunggu_pembayaran: { label: 'Menunggu', className: 'bg-yellow-50 text-yellow-700' },
  dikonfirmasi: { label: 'Dikonfirmasi', className: 'bg-blue-50 text-blue-700' },
  aktif: { label: 'Aktif', className: 'bg-green-50 text-green-700' },
  selesai: { label: 'Selesai', className: 'bg-zinc-100 text-zinc-600' },
  dibatalkan: { label: 'Dibatalkan', className: 'bg-red-50 text-red-700' },
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>
}) {
  const { start, end } = await searchParams
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  let profile: { name: string | null; role: string } | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('name, role').eq('id', user.id).single()
    profile = data
  }

  const { data: categories } = await supabase
    .from('equipment_categories')
    .select('id, name')
    .order('name')

  const { data: rawEquipment } = await supabase
    .from('equipment')
    .select('id, name, brand, size, price_per_day, category_id, equipment_categories(name)')
    .order('name')

  let availabilityMap: Record<string, number> | null = null
  if (start && end) {
    const { data: counts } = await supabase.rpc('get_available_counts', { p_start: start, p_end: end })
    availabilityMap = Object.fromEntries((counts ?? []).map((c: { equipment_id: string; available_count: number }) => [c.equipment_id, c.available_count]))
  }

  const items = (rawEquipment ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    size: item.size,
    price_per_day: item.price_per_day,
    category_id: item.category_id,
    category_name: (item.equipment_categories as unknown as { name: string } | null)?.name ?? '-',
    available_count: availabilityMap ? availabilityMap[item.id] ?? 0 : null,
  }))

  let recentBookings: { id: string; status: string; total_price: number }[] = []
  if (user) {
    const { data } = await supabase
      .from('bookings')
      .select('id, status, total_price')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
    recentBookings = data ?? []
  }

  return (
    <div className="min-h-screen bg-[#f4f8fc]">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-800 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v13M5 13c0-4 3-6 7-6s7 2 7 6" />
              </svg>
            </div>
            <span className="font-(family-name:--font-heading) text-lg font-extrabold tracking-tight text-zinc-900">
              Dive Rental
            </span>
          </div>

          <nav aria-label="Navigasi utama" className="flex items-center gap-1 sm:gap-2">
            {profile?.role === 'admin' && (
              <Link href="/admin" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 sm:block">
                Panel Admin
              </Link>
            )}
            {user && (
              <Link href="/my-bookings" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 sm:block">
                Booking Saya
              </Link>
            )}
            {user ? (
              <div className="flex min-w-0 items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-1.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white">
                  {(profile?.name ?? user.email ?? '?').charAt(0).toUpperCase()}
                </div>
                <span className="hidden max-w-40 truncate text-sm font-medium text-zinc-700 sm:inline">
                  {profile?.name ?? user.email}
                </span>
                <LogoutButton />
              </div>
            ) : (
              <Link href="/login" className="rounded-md bg-blue-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-900">
                Masuk
              </Link>
            )}
          </nav>
        </div>

        {/* nav mobile khusus, tampil di bawah bar utama saat layar sempit */}
        {(profile?.role === 'admin' || user) && (
          <nav aria-label="Navigasi tambahan" className="flex gap-2 border-t border-zinc-100 px-4 py-2 sm:hidden">
            {profile?.role === 'admin' && (
              <Link href="/admin" className="flex-1 rounded-md bg-zinc-100 px-3 py-2 text-center text-xs font-semibold text-zinc-700">
                Panel Admin
              </Link>
            )}
            {user && (
              <Link href="/my-bookings" className="flex-1 rounded-md bg-zinc-100 px-3 py-2 text-center text-xs font-semibold text-zinc-700">
                Booking Saya
              </Link>
            )}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-7 border-b border-zinc-200 pb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-800">Dive Rental · Indonesia</p>
          <h1 className="font-(family-name:--font-heading) text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
            {user ? `Halo, ${profile?.name ?? 'Penyelam'}` : 'Perlengkapan untuk penyelaman berikutnya'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">Atur periode sewa untuk melihat ketersediaan, lalu tambahkan perlengkapan yang Anda butuhkan ke keranjang.</p>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-9">
          <div className="min-w-0">
            <DateFilter />
            <section className="mt-8" aria-labelledby="catalog-title">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Katalog</p>
                  <h2 id="catalog-title" className="text-xl font-bold tracking-tight text-zinc-900">Pilih perlengkapan</h2>
                </div>
                <p className="text-sm text-zinc-500">{items.length} item</p>
              </div>
            <CatalogGrid categories={categories ?? []} items={items} />
            </section>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
            <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-zinc-900">Booking terakhir</h2>
                {user && recentBookings.length > 0 && <Link href="/my-bookings" className="text-xs font-semibold text-blue-800 hover:underline">Semua</Link>}
              </div>
              {!user ? (
                <p className="text-sm text-zinc-400">Masuk untuk melihat riwayat booking kamu.</p>
              ) : recentBookings.length === 0 ? (
                <p className="text-sm text-zinc-400">Belum ada booking.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentBookings.map((b) => {
                    const s = statusLabel[b.status] ?? { label: b.status, className: 'bg-zinc-100 text-zinc-600' }
                    return (
                      <Link key={b.id} href={`/booking/${b.id}`} className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2.5 transition hover:border-blue-700/40 hover:bg-zinc-50">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">#{b.id.slice(0, 8)}</p>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${s.className}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="shrink-0 text-right text-sm font-bold text-zinc-900">
                          Rp{Number(b.total_price).toLocaleString('id-ID')}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-blue-800/15 bg-blue-50 p-4 sm:p-5">
              <h2 className="mb-1 text-sm font-bold text-blue-950">Butuh bantuan?</h2>
              <p className="text-xs leading-5 text-blue-900/80">
                Pilih tanggal dulu supaya ketersediaan alat yang ditampilkan akurat.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}