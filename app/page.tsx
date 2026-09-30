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
    <div className="min-h-screen bg-zinc-50">
      {/* NAVBAR — gaya konsisten dengan panel admin */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v13M5 13c0-4 3-6 7-6s7 2 7 6" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-zinc-900">
              Dive Rental
            </span>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            {profile?.role === 'admin' && (
              <Link href="/admin" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 sm:block">
                Panel Admin
              </Link>
            )}
            {user && (
              <Link href="/my-bookings" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 sm:block">
                Booking Saya
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-2 rounded-full bg-zinc-100 py-1 pl-1 pr-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {(profile?.name ?? user.email ?? '?').charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium text-zinc-700 sm:inline">
                  {profile?.name ?? user.email}
                </span>
                <LogoutButton />
              </div>
            ) : (
              <Link href="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
                Masuk
              </Link>
            )}
          </nav>
        </div>

        {/* nav mobile khusus, tampil di bawah bar utama saat layar sempit */}
        {(profile?.role === 'admin' || user) && (
          <div className="flex gap-2 border-t border-zinc-100 px-4 py-2 sm:hidden">
            {profile?.role === 'admin' && (
              <Link href="/admin" className="flex-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-center text-xs font-semibold text-zinc-600">
                Panel Admin
              </Link>
            )}
            {user && (
              <Link href="/my-bookings" className="flex-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-center text-xs font-semibold text-zinc-600">
                Booking Saya
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold text-zinc-900">
            {user ? `Halo, ${profile?.name ?? 'Penyelam'} 👋` : 'Sewa Alat Selam'}
          </h1>
          <p className="text-sm text-zinc-500">Pilih tanggal, lihat ketersediaan, dan langsung booking.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <DateFilter />
            </div>
            <CatalogGrid categories={categories ?? []} items={items} />
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
              <h2 className="mb-3 text-sm font-bold text-zinc-900">Booking Terakhir</h2>
              {!user ? (
                <p className="text-sm text-zinc-400">Masuk untuk melihat riwayat booking kamu.</p>
              ) : recentBookings.length === 0 ? (
                <p className="text-sm text-zinc-400">Belum ada booking.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentBookings.map((b) => {
                    const s = statusLabel[b.status] ?? { label: b.status, className: 'bg-zinc-100 text-zinc-600' }
                    return (
                      <Link key={b.id} href={`/booking/${b.id}`} className="flex items-center justify-between rounded-xl px-3 py-2.5 ring-1 ring-zinc-100 hover:bg-zinc-50">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">#{b.id.slice(0, 8)}</p>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${s.className}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-zinc-900">
                          Rp{Number(b.total_price).toLocaleString('id-ID')}
                        </p>
                      </Link>
                    )
                  })}
                  <Link href="/my-bookings" className="text-center text-sm font-semibold text-blue-600 hover:underline">
                    Lihat semua →
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-100">
              <h2 className="mb-1 text-sm font-bold text-blue-900">Butuh bantuan?</h2>
              <p className="text-xs text-blue-700">
                Pilih tanggal dulu supaya ketersediaan alat yang ditampilkan akurat.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}