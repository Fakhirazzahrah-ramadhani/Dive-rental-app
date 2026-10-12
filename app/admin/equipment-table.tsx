'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { removeEquipmentImage, uploadEquipmentImage, validateImage } from '@/lib/equipment-image'
import { CODE_REGEX, CODE_RULE_TEXT, friendlyEquipmentError } from '@/lib/equipment-code'

type Category = { id: string; name: string }
type Equipment = {
  id: string
  code: string
  name: string
  brand: string | null
  size: string | null
  price_per_day: number
  category_id: string
  category_name: string
  image_url: string | null
  unit_total: number
  unit_available: number
}

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-blue-500'

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
        </svg>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200" />
  )
}

export default function EquipmentTable({ equipment, categories }: { equipment: Equipment[]; categories: Category[] }) {
  const router = useRouter()
  const supabase = createClient()

  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('semua')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Equipment>>({})
  const [newFile, setNewFile] = useState<File | null>(null)
  const [newPreview, setNewPreview] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of equipment) counts[item.category_id] = (counts[item.category_id] ?? 0) + 1
    return counts
  }, [equipment])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return equipment.filter((item) => {
      if (activeCategory !== 'semua' && item.category_id !== activeCategory) return false
      if (!q) return true
      return [item.code, item.name, item.brand, item.size, item.category_name].some((field) =>
        (field ?? '').toLowerCase().includes(q)
      )
    })
  }, [equipment, query, activeCategory])

  function resetPicker() {
    if (newPreview) URL.revokeObjectURL(newPreview)
    setNewFile(null)
    setNewPreview(null)
  }

  function startEdit(item: Equipment) {
    resetPicker()
    setEditingId(item.id)
    setForm(item)
  }

  function cancelEdit() {
    resetPicker()
    setEditingId(null)
  }

  function handlePickFile(file: File | null) {
    resetPicker()
    if (!file) return
    const invalid = validateImage(file)
    if (invalid) {
      alert(invalid)
      return
    }
    setNewFile(file)
    setNewPreview(URL.createObjectURL(file))
  }

  async function saveEdit(item: Equipment) {
    const cleanCode = (form.code ?? '').trim().toUpperCase()
    if (!CODE_REGEX.test(cleanCode)) {
      alert(CODE_RULE_TEXT)
      return
    }
    if (!form.name?.trim()) {
      alert('Nama alat tidak boleh kosong.')
      return
    }
    if (Number(form.price_per_day) < 0) {
      alert('Harga tidak boleh negatif.')
      return
    }

    setBusyId(item.id)

    let imageUrl = item.image_url
    if (newFile) {
      const res = await uploadEquipmentImage(newFile)
      if (res.error) {
        alert('Gagal upload gambar: ' + res.error)
        setBusyId(null)
        return
      }
      imageUrl = res.url ?? null
    }

    const { error } = await supabase
      .from('equipment')
      .update({
        category_id: form.category_id,
        code: cleanCode,
        name: form.name.trim(),
        brand: form.brand,
        size: form.size,
        price_per_day: Number(form.price_per_day),
        image_url: imageUrl,
      })
      .eq('id', item.id)

    if (error) {
      if (newFile && imageUrl) await removeEquipmentImage(imageUrl)
      alert('Gagal menyimpan: ' + friendlyEquipmentError(error))
      setBusyId(null)
      return
    }

    if (newFile && item.image_url) await removeEquipmentImage(item.image_url)

    setBusyId(null)
    cancelEdit()
    router.refresh()
  }

  async function handleDelete(item: Equipment) {
    if (!confirm(`Hapus alat "${item.name}" (${item.code})? Semua unit fisiknya juga ikut terhapus. Aksi ini tidak bisa dibatalkan.`)) return
    setBusyId(item.id)
    const { error } = await supabase.from('equipment').delete().eq('id', item.id)
    setBusyId(null)

    if (error) {
      alert(
        error.code === '23503'
          ? 'Alat ini punya riwayat booking, jadi tidak bisa dihapus. Ubah status unitnya jadi "Servis" kalau tidak ingin disewakan lagi.'
          : 'Gagal menghapus: ' + error.message
      )
      return
    }

    await removeEquipmentImage(item.image_url)
    router.refresh()
  }

  const chipBase = 'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition'
  const chipActive = 'bg-blue-600 text-white shadow-sm'
  const chipIdle = 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'

  return (
    <div className="flex flex-col gap-4">
      {/* PENCARIAN + FILTER KATEGORI */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kode, nama, merek, ukuran, atau kategori..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory('semua')} className={`${chipBase} ${activeCategory === 'semua' ? chipActive : chipIdle}`}>
            Semua
            <span className={`text-xs ${activeCategory === 'semua' ? 'text-blue-100' : 'text-zinc-400'}`}>{equipment.length}</span>
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`${chipBase} ${activeCategory === c.id ? chipActive : chipIdle}`}>
              {c.name}
              <span className={`text-xs ${activeCategory === c.id ? 'text-blue-100' : 'text-zinc-400'}`}>{categoryCounts[c.id] ?? 0}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-zinc-400">
          Menampilkan {filtered.length} dari {equipment.length} alat
        </p>
      </div>

      {/* TABEL */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3 font-medium">Foto</th>
              <th className="px-5 py-3 font-medium">Kode</th>
              <th className="px-5 py-3 font-medium">Nama</th>
              <th className="px-5 py-3 font-medium">Kategori</th>
              <th className="px-5 py-3 font-medium">Merek</th>
              <th className="px-5 py-3 font-medium">Ukuran</th>
              <th className="px-5 py-3 font-medium">Harga/hari</th>
              <th className="px-5 py-3 font-medium">Unit</th>
              <th className="px-5 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isEditing = editingId === item.id
              const isBusy = busyId === item.id

              if (isEditing) {
                return (
                  <tr key={item.id} className="border-b border-zinc-100 bg-blue-50/60">
                    <td className="p-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <Thumb src={newPreview ?? item.image_url} alt={item.name} />
                        <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline">
                          Ganti foto
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        className={`${inputClass} font-mono`}
                        value={form.code ?? ''}
                        maxLength={30}
                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      />
                    </td>
                    <td className="p-3">
                      <input className={inputClass} value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </td>
                    <td className="p-3">
                      <select className={inputClass} value={form.category_id ?? ''} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <input className={inputClass} value={form.brand ?? ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                    </td>
                    <td className="p-3">
                      <input className={inputClass} value={form.size ?? ''} onChange={(e) => setForm({ ...form, size: e.target.value })} />
                    </td>
                    <td className="p-3">
                      <input
                        className={inputClass}
                        type="number"
                        min={0}
                        value={form.price_per_day ?? 0}
                        onChange={(e) => setForm({ ...form, price_per_day: Number(e.target.value) })}
                      />
                    </td>
                    <td className="p-3 text-xs text-zinc-400">{item.unit_total} unit</td>
                    <td className="p-3 whitespace-nowrap">
                      <button
                        onClick={() => saveEdit(item)}
                        disabled={isBusy}
                        className="mr-2 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {isBusy ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button onClick={cancelEdit} disabled={isBusy} className="rounded-md bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-300 disabled:opacity-50">
                        Batal
                      </button>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={item.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-3">
                    <Thumb src={item.image_url} alt={item.name} />
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs font-semibold text-zinc-700">{item.code}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-zinc-900">{item.name}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{item.category_name}</span>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{item.brand || '-'}</td>
                  <td className="px-5 py-3 text-zinc-600">{item.size || '-'}</td>
                  <td className="px-5 py-3 font-medium whitespace-nowrap text-zinc-900">Rp{Number(item.price_per_day).toLocaleString('id-ID')}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <p className="font-medium text-zinc-900">{item.unit_total} unit</p>
                    <p className="text-xs text-zinc-400">{item.unit_available} tersedia</p>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <Link
                      href={`/admin/alat/${item.id}`}
                      className="mr-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
                    >
                      Kelola Unit
                    </Link>
                    <button
                      onClick={() => startEdit(item)}
                      className="mr-2 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={isBusy}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="p-10 text-center text-sm text-zinc-400">
                  {equipment.length === 0 ? (
                    'Belum ada alat.'
                  ) : (
                    <>
                      Tidak ada alat yang cocok.{' '}
                      <button
                        onClick={() => {
                          setQuery('')
                          setActiveCategory('semua')
                        }}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        Reset pencarian
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}