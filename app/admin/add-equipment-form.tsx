'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { removeEquipmentImage, uploadEquipmentImage, validateImage } from '@/lib/equipment-image'
import { CODE_REGEX, CODE_RULE_TEXT, friendlyEquipmentError } from '@/lib/equipment-code'

type Category = { id: string; name: string }
type Feedback = { type: 'error' | 'success'; text: string } | null

const inputClass =
  'rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const labelClass = 'mb-1.5 text-sm font-medium text-zinc-700'

export default function AddEquipmentForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const supabase = createClient()

  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileKey, setFileKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  function handlePickFile(picked: File | null) {
    if (preview) URL.revokeObjectURL(preview)
    if (!picked) {
      setFile(null)
      setPreview(null)
      return
    }
    const invalid = validateImage(picked)
    if (invalid) {
      setFeedback({ type: 'error', text: invalid })
      setFile(null)
      setPreview(null)
      setFileKey((k) => k + 1)
      return
    }
    setFeedback(null)
    setFile(picked)
    setPreview(URL.createObjectURL(picked))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)

    const cleanCode = code.trim().toUpperCase()
    if (cleanCode && !CODE_REGEX.test(cleanCode)) {
      setFeedback({ type: 'error', text: CODE_RULE_TEXT })
      return
    }
    if (Number(price) < 0) {
      setFeedback({ type: 'error', text: 'Harga tidak boleh negatif.' })
      return
    }

    setLoading(true)

    let imageUrl: string | null = null
    if (file) {
      const res = await uploadEquipmentImage(file)
      if (res.error) {
        setFeedback({ type: 'error', text: res.error })
        setLoading(false)
        return
      }
      imageUrl = res.url ?? null
    }

    const { data, error } = await supabase
      .from('equipment')
      .insert({
        category_id: categoryId,
        code: cleanCode, // kosong = dibuat otomatis oleh database
        name: name.trim(),
        brand: brand.trim(),
        size: size.trim(),
        price_per_day: Number(price),
        image_url: imageUrl,
      })
      .select('code')
      .single()

    if (error) {
      if (imageUrl) await removeEquipmentImage(imageUrl)
      setFeedback({ type: 'error', text: friendlyEquipmentError(error) })
    } else {
      setCode('')
      setName('')
      setBrand('')
      setSize('')
      setPrice('')
      handlePickFile(null)
      setFileKey((k) => k + 1)
      setFeedback({ type: 'success', text: `Alat berhasil ditambahkan dengan kode ${data?.code ?? cleanCode}.` })
      router.refresh()
    }
    setLoading(false)
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
        Belum ada kategori. Tambahkan dulu di bagian &quot;Kategori Alat&quot; di atas.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="flex flex-col">
          <label className={labelClass}>Kategori</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>Kode alat</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Otomatis"
            maxLength={30}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>Nama alat</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="BCD Cressi" required className={inputClass} />
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>Merek</label>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Scubapro" className={inputClass} />
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>Ukuran</label>
          <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="M / XL" className={inputClass} />
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>Harga/hari (Rp)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            min={0}
            placeholder="150000"
            required
            className={inputClass}
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        Kode alat boleh dikosongkan, nanti dibuat otomatis dari kategori (contoh: WET-001). Kalau diisi sendiri, hanya huruf, angka, dan tanda hubung.
      </p>

      <div className="mt-5 flex items-center gap-4 border-t border-zinc-100 pt-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratinjau foto alat" className="h-full w-full object-cover" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
            </svg>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Foto alat (opsional)</label>
          <input
            key={fileKey}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
            className="text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-zinc-400">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-zinc-100 pt-5">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Tambah Alat'}
        </button>
        {feedback && (
          <p className={`text-sm ${feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{feedback.text}</p>
        )}
      </div>
    </form>
  )
}