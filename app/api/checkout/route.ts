import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { sendBookingNotifications } from '@/lib/booking-notifications'

type CheckoutItem = { equipmentId: string; quantity: number }

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ message: 'Kamu harus login dulu.' }, { status: 401 })
  }

  const body = await request.json()
  const { startDate, endDate, items } = body as { startDate: string; endDate: string; items: CheckoutItem[] }

  if (!startDate || !endDate || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ message: 'Data booking tidak lengkap.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: bookingId, error } = await admin.rpc('create_booking', {
    p_user_id: user.id,
    p_start: startDate,
    p_end: endDate,
    p_items: items.map((i) => ({ equipment_id: i.equipmentId, quantity: i.quantity })),
  })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 409 })
  }

  try {
    const { data: rawBooking, error: bookingError } = await admin
      .from('bookings')
      .select('id, start_date, end_date, total_price, profiles(name, phone), booking_items(equipment_units(unit_code, equipment(name)))')
      .eq('id', bookingId)
      .single()

    if (bookingError || !rawBooking) {
      console.error('Booking dibuat, tetapi detail untuk notifikasi gagal diambil:', bookingError?.message)
    } else {
      const booking = rawBooking as unknown as {
        id: string
        start_date: string
        end_date: string
        total_price: number
        profiles: { name: string | null; phone: string | null } | { name: string | null; phone: string | null }[] | null
        booking_items: {
          equipment_units: {
            unit_code: string
            equipment: { name: string } | { name: string }[] | null
          } | {
            unit_code: string
            equipment: { name: string } | { name: string }[] | null
          }[] | null
        }[] | null
      }
      const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles
      const items = (booking.booking_items ?? []).flatMap((item) => {
        const unitRelation = item.equipment_units
        const unit = Array.isArray(unitRelation) ? unitRelation[0] : unitRelation
        if (!unit) return []

        const equipmentRelation = unit.equipment
        const equipment = Array.isArray(equipmentRelation) ? equipmentRelation[0] : equipmentRelation
        return [{ name: equipment?.name ?? 'Alat', unitCode: unit.unit_code }]
      })

      await sendBookingNotifications({
        bookingId: booking.id,
        customerName: profile?.name ?? 'Pelanggan',
        customerEmail: user.email ?? '',
        customerPhone: profile?.phone ?? '',
        startDate: booking.start_date,
        endDate: booking.end_date,
        totalPrice: Number(booking.total_price),
        items,
      })
    }
  } catch (notificationError) {
    console.error('Booking dibuat, tetapi notifikasi tidak berhasil diproses:', notificationError)
  }

  return NextResponse.json({ bookingId })
}