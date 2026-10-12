'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type RentedItem = {
  unit_code: string
  equipment_name: string
  renter_name: string
  start_date: string
  end_date: string
  booking_id: string
}

export default function ReturnsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [rentedItems, setRentedItems] = useState<RentedItem[]>([])
  const [fetching, setFetching] = useState(true)

  // Form State
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [unitCode, setUnitCode] = useState('')
  const [equipmentName, setEquipmentName] = useState('')
  const [condition, setCondition] = useState('good')
  const [damageFee, setDamageFee] = useState('0')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [checks, setChecks] = useState({
    rinsedFreshwater: false,
    bladderLeak: false,
    inflatorPurge: false,
    hoseMouthpiece: false,
    strapsBuckles: false,
  })

  // Ambil daftar barang yang statusnya sedang tersewa / belum kembali
  async function fetchRentedItems() {
    setFetching(true)
    const { data, error } = await supabase
      .from('equipment_units')
      .select(`
        unit_code,
        status,
        equipment (
          name,
          size
        )
      `)
      .eq('status', 'disewa') // Sesuaikan dengan status terpinjam di DB Anda (misal 'disewa' atau 'rented')

    if (!error && data) {
      const formatted: RentedItem[] = data.map((item: any) => ({
        unit_code: item.unit_code,
        equipment_name: `${item.equipment?.name ?? '-'} (${item.equipment?.size ?? '-'})`,
        renter_name: 'Sedang Disewa', // Bisa dihubungkan ke relasi booking jika ada
        start_date: '-',
        end_date: '-',
        booking_id: '',
      }))
      setRentedItems(formatted)
    }
    setFetching(false)
  }

  useEffect(() => {
    fetchRentedItems()
  }, [])

  const toggleCheck = (k: keyof typeof checks) => {
    setChecks((prev) => ({ ...prev, [k]: !prev[k] }))
  }

  // Klik dari tabel untuk mengisi form
  function handleSelectUnit(item: RentedItem) {
    setUnitCode(item.unit_code)
    setEquipmentName(item.equipment_name)
    setSelectedBookingId(item.booking_id || null)
    setMsg(null)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setLoading(true)

    const code = unitCode.trim().toUpperCase()

    // 1. Simpan riwayat inspeksi
    const { error: insErr } = await supabase.from('return_inspections').insert({
      unit_code: code,
      booking_id: selectedBookingId,
      equipment_name: equipmentName.trim() || null,
      condition_status: condition,
      checklist: checks,
      damage_fee: Number(damageFee) || 0,
      notes: notes.trim() || null,
    })

    if (insErr) {
      setMsg({ type: 'err', text: `Gagal menyimpan: ${insErr.message}` })
      setLoading(false)
      return
    }

    // 2. Perbarui status unit di tabel equipment_units menjadi 'tersedia' / 'rusak'
    const newStatus = condition === 'good' ? 'tersedia' : 'rusak'
    await supabase
      .from('equipment_units')
      .update({ status: newStatus })
      .eq('unit_code', code)

    setMsg({ type: 'ok', text: `Unit ${code} berhasil diperiksa dan status diubah menjadi "${newStatus}".` })
    
    // Reset form & refresh daftar tabel
    setUnitCode('')
    setEquipmentName('')
    setSelectedBookingId(null)
    setDamageFee('0')
    setNotes('')
    setChecks({
      rinsedFreshwater: false,
      bladderLeak: false,
      inflatorPurge: false,
      hoseMouthpiece: false,
      strapsBuckles: false,
    })
    setLoading(false)
    fetchRentedItems()
    router.refresh()
  }

  return (
    <div className="space-y-10">
      {/* BAGIAN 1: TABEL BARANG TERPINJAM */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Monitoring Sewa</p>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Daftar Barang Sedang Terpinjam ({rentedItems.length})
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-5 py-3.5">Kode Unit</th>
                  <th className="px-5 py-3.5">Nama Alat & Ukuran</th>
                  <th className="px-5 py-3.5">Status Unit</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {fetching ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">
                      Memuat daftar alat...
                    </td>
                  </tr>
                ) : rentedItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">
                      Tidak ada alat yang sedang terpinjam saat ini.
                    </td>
                  </tr>
                ) : (
                  rentedItems.map((item) => (
                    <tr key={item.unit_code} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="px-5 py-4 font-mono font-medium text-zinc-900 dark:text-white">
                        {item.unit_code}
                      </td>
                      <td className="px-5 py-4 font-medium text-zinc-800 dark:text-zinc-200">
                        {item.equipment_name}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          Sedang Disewa
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectUnit(item)}
                          className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          Pilih untuk Inspeksi ↓
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* BAGIAN 2: FORM INSPEKSI PENGEMBALIAN */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Formulir Pengembalian</p>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Inspeksi & Checklist Alat</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Kode Unit / Alat</label>
              <input
                type="text"
                required
                placeholder="Pilih dari tabel atau ketik manual..."
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-zinc-300 p-2.5 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nama Alat</label>
              <input
                type="text"
                placeholder="Otomatis terisi jika dipilih dari tabel"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status Kondisi Fisik</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="good">Baik / Siap Pakai (Unit kembali Tersedia)</option>
              <option value="needs_cleaning">Perlu Bilas / Cuci Ulang</option>
              <option value="maintenance">Perlu Servis / Perbaikan</option>
              <option value="damaged">Rusak / Sobek (Unit diset Rusak)</option>
              <option value="lost">Hilang</option>
            </select>
          </div>

          <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <label className="mb-3 block text-sm font-semibold text-zinc-800 dark:text-zinc-200">Pemeriksaan Fungsi & Keamanan Selam</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-zinc-700 dark:text-zinc-300">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={checks.rinsedFreshwater} onChange={() => toggleCheck('rinsedFreshwater')} className="size-4 rounded text-blue-600" />
                Sudah dibilas air tawar bersih
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={checks.bladderLeak} onChange={() => toggleCheck('bladderLeak')} className="size-4 rounded text-blue-600" />
                Kantung udara BCD tidak bocor
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={checks.inflatorPurge} onChange={() => toggleCheck('inflatorPurge')} className="size-4 rounded text-blue-600" />
                Inflator / Tombol Purge lancar
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={checks.hoseMouthpiece} onChange={() => toggleCheck('hoseMouthpiece')} className="size-4 rounded text-blue-600" />
                Selang & Mouthpiece utuh
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={checks.strapsBuckles} onChange={() => toggleCheck('strapsBuckles')} className="size-4 rounded text-blue-600" />
                Strap, Buckle, Resleting utuh
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Denda / Biaya Kerusakan (Rp)</label>
              <input
                type="number"
                min={0}
                value={damageFee}
                onChange={(e) => setDamageFee(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Catatan Tambahan</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Keterangan kerusakan jika ada..."
                className="w-full rounded-lg border border-zinc-300 p-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-900 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Hasil Inspeksi'}
            </button>
            {msg && (
              <p className={`text-sm ${msg.type === 'err' ? 'text-red-600' : 'text-green-600'}`}>
                {msg.text}
              </p>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}