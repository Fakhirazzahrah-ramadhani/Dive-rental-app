import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import BookingsTable from './bookings-table'

export default async function AdminBookingsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: rawBookings } = await supabase
    .from('bookings')
    .select('id, start_date, end_date, status, total_price, expires_at, created_at, profiles(name, phone), booking_items(id, equipment_units(unit_code, equipment(name)))')
    .order('created_at', { ascending: false })

  const bookings = (rawBookings ?? []).map((b) => {
    const profile = b.profiles as unknown as { name: string | null; phone: string | null } | null
    const items = (b.booking_items as unknown as {
      id: string
      equipment_units: { unit_code: string; equipment: { name: string } | null } | null
    }[]) ?? []

    return {
      id: b.id,
      customerName: profile?.name ?? '-',
      customerPhone: profile?.phone ?? '-',
      startDate: b.start_date,
      endDate: b.end_date,
      status: b.status,
      totalPrice: b.total_price,
      expiresAt: b.expires_at,
      itemsText: items.map((i) => i.equipment_units?.equipment?.name ?? '-').join(', '),
    }
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Booking
        </p>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Semua Booking ({bookings.length})
        </h2>
      </div>
      <BookingsTable bookings={bookings} />
    </div>
  )
}