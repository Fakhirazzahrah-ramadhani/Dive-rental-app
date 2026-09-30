import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

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

  return NextResponse.json({ bookingId })
}