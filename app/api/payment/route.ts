import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import midtransClient from 'midtrans-client'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ message: 'Kamu harus login dulu.' }, { status: 401 })
  }

  const { bookingId } = await request.json()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, total_price, status, user_id, expires_at')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.user_id !== user.id) {
    return NextResponse.json({ message: 'Booking tidak ditemukan.' }, { status: 404 })
  }

  if (booking.status !== 'menunggu_pembayaran') {
    return NextResponse.json({ message: 'Booking ini sudah tidak bisa dibayar.' }, { status: 400 })
  }

  if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
    return NextResponse.json({ message: 'Waktu pembayaran booking ini sudah habis.' }, { status: 400 })
  }

  const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
  })

  const transaction = await snap.createTransaction({
    transaction_details: {
      order_id: `${booking.id}-${Date.now()}`,
      gross_amount: Number(booking.total_price),
    },
    customer_details: {
      email: user.email,
    },
    // penting: kaitkan order_id ke booking_id asli, karena Midtrans butuh order_id unik tiap percobaan bayar
    metadata: { booking_id: booking.id },
  })

  return NextResponse.json({ token: transaction.token })
}