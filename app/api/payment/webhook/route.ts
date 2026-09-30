import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body

  const expectedSignature = crypto
    .createHash('sha512')
    .update(order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY)
    .digest('hex')

  if (signature_key !== expectedSignature) {
    return NextResponse.json({ message: 'Signature tidak valid.' }, { status: 403 })
  }

  const bookingId = order_id.split('-').slice(0, 5).join('-')

  const admin = createAdminClient()

  let newStatus: string | null = null
  if (transaction_status === 'capture' || transaction_status === 'settlement') {
    if (fraud_status === 'accept' || !fraud_status) {
      newStatus = 'dikonfirmasi'
    }
  } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
    newStatus = 'dibatalkan'
  }

  if (newStatus) {
    await admin
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)
      .eq('status', 'menunggu_pembayaran')
  }

  return NextResponse.json({ message: 'OK' })
}