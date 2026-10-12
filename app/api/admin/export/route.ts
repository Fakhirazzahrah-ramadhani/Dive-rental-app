import ExcelJS from 'exceljs'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

const PAGE_SIZE = 1000

type Related<T> = T | T[] | null | undefined

type EquipmentRow = {
  id: string
  name: string
  brand: string | null
  size: string | null
  price_per_day: number
  equipment_categories: Related<{ name: string }>
}

type UnitRow = {
  equipment_id: string
  unit_code: string
  condition: string
  status: string
  equipment: Related<{ name: string }>
}

type BookingRow = {
  id: string
  start_date: string
  end_date: string
  status: string
  total_price: number
  deposit_amount: number | null
  created_at: string
  expires_at: string | null
  profiles: Related<{ name: string | null; phone: string | null }>
  booking_items: {
    equipment_units: Related<{
      unit_code: string
      equipment: Related<{ name: string }>
    }>
  }[]
}

function firstRelated<T>(value: Related<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

async function fetchAllRows<Row>(
  fetchPage: (from: number, to: number) => Promise<{ data: Row[] | null; error: { message: string } | null }>,
) {
  const rows: Row[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)

    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

function setHeaderStyle(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1)
  header.height = 24
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', wrapText: true }
  })

  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  if (sheet.columnCount > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columnCount },
    }
  }
}

function excelDate(value: string | null) {
  if (!value) return null
  const date = value.slice(0, 10)
  return new Date(`${date}T00:00:00`)
}

const bookingStatusLabels: Record<string, string> = {
  menunggu_pembayaran: 'Menunggu Pembayaran',
  dikonfirmasi: 'Dikonfirmasi',
  aktif: 'Aktif',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
}

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ message: 'Silakan masuk sebagai admin.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ message: 'Akses hanya tersedia untuk admin.' }, { status: 403 })
  }

  try {
    const [equipment, units, bookings] = await Promise.all([
      fetchAllRows<EquipmentRow>((from, to) =>
        (async () => await supabase
          .from('equipment')
          .select('id, name, brand, size, price_per_day, equipment_categories(name)')
          .order('name')
          .order('id')
          .range(from, to))(),
      ),
      fetchAllRows<UnitRow>((from, to) =>
        (async () => await supabase
          .from('equipment_units')
          .select('equipment_id, unit_code, condition, status, equipment(name)')
          .order('unit_code')
          .order('equipment_id')
          .range(from, to))(),
      ),
      fetchAllRows<BookingRow>((from, to) =>
        (async () => await supabase
          .from('bookings')
          .select('id, start_date, end_date, status, total_price, deposit_amount, created_at, expires_at, profiles(name, phone), booking_items(equipment_units(unit_code, equipment(name)))')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to))(),
      ),
    ])

    const unitCounts = new Map<string, { total: number; available: number }>()
    for (const unit of units) {
      const counts = unitCounts.get(unit.equipment_id) ?? { total: 0, available: 0 }
      counts.total += 1
      if (unit.status === 'tersedia') counts.available += 1
      unitCounts.set(unit.equipment_id, counts)
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Dive Rental'
    workbook.created = new Date()

    const inventorySheet = workbook.addWorksheet('Inventaris')
    inventorySheet.columns = [
      { header: 'ID Alat', key: 'id', width: 38 },
      { header: 'Nama Alat', key: 'name', width: 28 },
      { header: 'Kategori', key: 'category', width: 22 },
      { header: 'Merek', key: 'brand', width: 20 },
      { header: 'Ukuran', key: 'size', width: 14 },
      { header: 'Harga per Hari (Rp)', key: 'price', width: 20, style: { numFmt: '"Rp" #,##0' } },
      { header: 'Jumlah Unit', key: 'unitCount', width: 14 },
      { header: 'Unit Tersedia', key: 'availableCount', width: 16 },
    ]
    inventorySheet.addRows(equipment.map((item) => {
      const counts = unitCounts.get(item.id) ?? { total: 0, available: 0 }
      return {
        id: item.id,
        name: item.name,
        category: firstRelated(item.equipment_categories)?.name ?? '-',
        brand: item.brand ?? '',
        size: item.size ?? '',
        price: Number(item.price_per_day),
        unitCount: counts.total,
        availableCount: counts.available,
      }
    }))
    setHeaderStyle(inventorySheet)

    const unitSheet = workbook.addWorksheet('Unit Alat')
    unitSheet.columns = [
      { header: 'Kode Unit', key: 'code', width: 22 },
      { header: 'Nama Alat', key: 'equipment', width: 28 },
      { header: 'Kondisi', key: 'condition', width: 20 },
      { header: 'Status', key: 'status', width: 20 },
    ]
    unitSheet.addRows(units.map((unit) => ({
      code: unit.unit_code,
      equipment: firstRelated(unit.equipment)?.name ?? '-',
      condition: unit.condition,
      status: unit.status,
    })))
    setHeaderStyle(unitSheet)

    const bookingSheet = workbook.addWorksheet('Riwayat Booking')
    bookingSheet.columns = [
      { header: 'ID Booking', key: 'id', width: 38 },
      { header: 'Nama Pelanggan', key: 'customer', width: 26 },
      { header: 'Telepon', key: 'phone', width: 20 },
      { header: 'Tanggal Mulai', key: 'startDate', width: 18, style: { numFmt: 'dd mmm yyyy' } },
      { header: 'Tanggal Selesai', key: 'endDate', width: 18, style: { numFmt: 'dd mmm yyyy' } },
      { header: 'Perlengkapan', key: 'items', width: 52 },
      { header: 'Status', key: 'status', width: 24 },
      { header: 'Total (Rp)', key: 'total', width: 18, style: { numFmt: '"Rp" #,##0' } },
      { header: 'Deposit (Rp)', key: 'deposit', width: 18, style: { numFmt: '"Rp" #,##0' } },
      { header: 'Waktu Booking', key: 'createdAt', width: 22, style: { numFmt: 'dd mmm yyyy hh:mm' } },
      { header: 'Batas Pembayaran', key: 'expiresAt', width: 22, style: { numFmt: 'dd mmm yyyy hh:mm' } },
    ]
    bookingSheet.addRows(bookings.map((booking) => ({
      id: booking.id,
      customer: firstRelated(booking.profiles)?.name ?? '-',
      phone: firstRelated(booking.profiles)?.phone ?? '',
      startDate: excelDate(booking.start_date),
      endDate: excelDate(booking.end_date),
      items: (booking.booking_items ?? []).map((item) => {
        const unit = firstRelated(item.equipment_units)
        if (!unit) return '-'
        return `${firstRelated(unit.equipment)?.name ?? '-'}${unit.unit_code ? ` (${unit.unit_code})` : ''}`
      }).join(', '),
      status: booking.status === 'menunggu_pembayaran' && booking.expires_at && new Date(booking.expires_at) < new Date()
        ? 'Kedaluwarsa'
        : bookingStatusLabels[booking.status] ?? booking.status,
      total: Number(booking.total_price),
      deposit: booking.deposit_amount === null ? null : Number(booking.deposit_amount),
      createdAt: booking.created_at ? new Date(booking.created_at) : null,
      expiresAt: booking.expires_at ? new Date(booking.expires_at) : null,
    })))
    setHeaderStyle(bookingSheet)

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `dive-rental-${new Date().toISOString().slice(0, 10)}.xlsx`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Gagal membuat export Excel:', error)
    return Response.json({ message: 'Gagal menyiapkan file Excel.' }, { status: 500 })
  }
}