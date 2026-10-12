import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

function isTableMissingError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false
  const message = error.message ?? ''
  return error.code === '42P01' || message.toLowerCase().includes('does not exist') || message.toLowerCase().includes('relation')
}

async function requireAdminUser() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null

  return user
}

function toNumber(value: number | string | null | undefined) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function normalizeRecord(record: any) {
  return {
    id: record?.id ?? crypto.randomUUID(),
    type: record?.type ?? 'income',
    category: record?.category ?? 'lainnya',
    amount: toNumber(record?.amount),
    description: record?.description ?? 'Catatan kas',
    note: record?.note ?? null,
    reference: record?.reference ?? null,
    created_at: record?.created_at ?? new Date().toISOString(),
  }
}

export async function GET() {
  const user = await requireAdminUser()
  if (!user) {
    return NextResponse.json({ message: 'Akses hanya untuk admin.' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, status, total_price, created_at')
      .in('status', ['dikonfirmasi', 'aktif', 'selesai'])
      .order('created_at', { ascending: false })

    if (bookingsError) {
      throw bookingsError
    }

    let totalRevenue = 0
    for (const booking of bookings ?? []) {
      totalRevenue += toNumber(booking.total_price)
    }

    let totalMaintenanceExpense = 0
    let totalExpense = 0
    let totalMaintenanceReserve = 0
    let cashBalance = 0
    let cashRecords: any[] = []

    const { data: recordRows, error: recordsError } = await supabase
      .from('cash_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (recordsError && !isTableMissingError(recordsError)) {
      throw recordsError
    }

    cashRecords = (recordRows ?? []).map(normalizeRecord)

    for (const record of cashRecords) {
      if (record.type === 'income') {
        cashBalance += record.amount
      } else {
        cashBalance -= record.amount
        totalExpense += record.amount
      }

      if (record.category === 'maintenance') {
        if (record.type === 'income') {
          totalMaintenanceReserve += record.amount
        } else {
          totalMaintenanceExpense += record.amount
        }
      }
    }

    const netProfit = totalRevenue - totalExpense

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalExpense,
        netProfit,
        maintenanceReserve: totalMaintenanceReserve,
        maintenanceExpense: totalMaintenanceExpense,
        cashBalance,
      },
      records: cashRecords,
    })
  } catch (error: any) {
    return NextResponse.json({
      message: error?.message ?? 'Gagal mengambil data keuangan.',
      summary: {
        totalRevenue: 0,
        totalExpense: 0,
        netProfit: 0,
        maintenanceReserve: 0,
        maintenanceExpense: 0,
        cashBalance: 0,
      },
      records: [],
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await requireAdminUser()
  if (!user) {
    return NextResponse.json({ message: 'Akses hanya untuk admin.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const type = body?.type === 'expense' ? 'expense' : 'income'
    const category = String(body?.category ?? 'lainnya')
    const amount = Number(body?.amount ?? 0)
    const description = String(body?.description ?? '').trim() || 'Catatan kas'
    const note = body?.note ? String(body.note) : null
    const reference = body?.reference ? String(body.reference) : null
    const createdAt = body?.created_at ? String(body.created_at) : new Date().toISOString()

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: 'Nominal harus lebih dari 0.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('cash_records')
      .insert({
        type,
        category,
        amount,
        description,
        note,
        reference,
        created_at: createdAt,
      })

    if (error) {
      if (isTableMissingError(error)) {
        return NextResponse.json({
          message: 'Tabel cash_records belum dibuat. Silakan buat tabel di Supabase baru.',
        }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ message: 'Catatan kas berhasil disimpan.' })
  } catch (error: any) {
    return NextResponse.json({ message: error?.message ?? 'Gagal menyimpan catatan kas.' }, { status: 500 })
  }
}
