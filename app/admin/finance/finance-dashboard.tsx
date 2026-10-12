'use client'

import { useEffect, useState } from 'react'

type RecordType = 'income' | 'expense'

type CashRecord = {
  id: string
  type: RecordType
  category: string
  amount: number
  description: string
  note: string | null
  reference: string | null
  created_at: string
}

type FinanceSummary = {
  totalRevenue: number
  totalExpense: number
  netProfit: number
  maintenanceReserve: number
  maintenanceExpense: number
  cashBalance: number
}

const categories = ['booking', 'maintenance', 'operasional', 'lainnya']

export default function FinanceDashboard() {
  const [summary, setSummary] = useState<FinanceSummary>({
    totalRevenue: 0,
    totalExpense: 0,
    netProfit: 0,
    maintenanceReserve: 0,
    maintenanceExpense: 0,
    cashBalance: 0,
  })
  const [records, setRecords] = useState<CashRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    type: 'income' as RecordType,
    category: 'booking',
    amount: '',
    description: '',
    note: '',
    reference: '',
    created_at: new Date().toISOString().slice(0, 10),
  })

  async function loadFinance() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/finance')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message ?? 'Gagal mengambil data keuangan.')
      }

      setSummary(data.summary)
      setRecords(data.records ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data keuangan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinance()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        type: form.type,
        category: form.category,
        amount: Number(form.amount),
        description: form.description,
        note: form.note,
        reference: form.reference,
        created_at: `${form.created_at}T00:00:00.000Z`,
      }

      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message ?? 'Gagal menyimpan catatan kas.')
      }

      setForm({
        type: 'income',
        category: 'booking',
        amount: '',
        description: '',
        note: '',
        reference: '',
        created_at: new Date().toISOString().slice(0, 10),
      })

      await loadFinance()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan catatan kas.')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Pendapatan Booking', value: formatCurrency(summary.totalRevenue), tone: 'bg-blue-50 text-blue-900' },
          { label: 'Pengeluaran', value: formatCurrency(summary.totalExpense), tone: 'bg-rose-50 text-rose-900' },
          { label: 'Laba Bersih', value: formatCurrency(summary.netProfit), tone: 'bg-emerald-50 text-emerald-900' },
          { label: 'Dana Maintenance', value: formatCurrency(summary.maintenanceReserve), tone: 'bg-amber-50 text-amber-900' },
          { label: 'Saldo Kas', value: formatCurrency(summary.cashBalance), tone: 'bg-violet-50 text-violet-900' },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl border border-zinc-200 p-4 ${card.tone}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{card.label}</p>
            <p className="mt-3 text-xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={onSubmit} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Kas & maintenance</p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-900">Catat Transaksi</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Jenis</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as RecordType })}
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
              >
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Tanggal</label>
              <input
                type="date"
                value={form.created_at}
                onChange={(e) => setForm({ ...form, created_at: e.target.value })}
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Nominal</label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="500000"
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Deskripsi</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Contoh: Servis regulator, Setoran booking, dll."
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Catatan</label>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Opsional"
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Referensi</label>
              <input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="Opsional"
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-blue-800 px-4 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan Catatan'}
          </button>
        </form>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Riwayat</p>
              <h3 className="mt-1 text-lg font-semibold text-zinc-900">Pencatatan Kas</h3>
            </div>
            <button
              type="button"
              onClick={() => loadFinance()}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-zinc-500">Memuat data keuangan...</p>
          ) : records.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
              Belum ada catatan kas. Mulai dengan menambahkan transaksi yang masuk atau keluar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-600">
                    <th className="py-2 pr-3 font-medium">Tanggal</th>
                    <th className="py-2 pr-3 font-medium">Jenis</th>
                    <th className="py-2 pr-3 font-medium">Kategori</th>
                    <th className="py-2 pr-3 font-medium">Deskripsi</th>
                    <th className="py-2 pr-3 font-medium text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b border-zinc-100 align-top">
                      <td className="py-2 pr-3 text-zinc-600">{new Date(record.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${record.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {record.type === 'income' ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-zinc-600">{record.category}</td>
                      <td className="py-2 pr-3 text-zinc-700">{record.description}</td>
                      <td className={`py-2 text-right font-semibold ${record.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
