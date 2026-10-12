'use client'

import { useState } from 'react'
import { useCart } from './cart-context'
import { Check, PackagePlus } from 'lucide-react'

type Category = { id: string; name: string }
type Item = {
  id: string
  name: string
  brand: string | null
  size: string | null
  price_per_day: number
  category_id: string
  category_name: string
  available_count: number | null
}

export default function CatalogGrid({ categories, items }: { categories: Category[]; items: Item[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('semua')
  const { items: cartItems, addItem } = useCart()

  const filtered = activeCategory === 'semua' ? items : items.filter((i) => i.category_id === activeCategory)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" aria-label="Filter kategori">
        <button
          onClick={() => setActiveCategory('semua')}
          aria-pressed={activeCategory === 'semua'}
          className={`min-h-9 rounded-md px-3.5 text-sm font-semibold transition ${
            activeCategory === 'semua'
              ? 'bg-blue-800 text-white'
              : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'
          }`}
        >
          Semua
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            aria-pressed={activeCategory === c.id}
            className={`min-h-9 rounded-md px-3.5 text-sm font-semibold transition ${
              activeCategory === c.id
                ? 'bg-blue-800 text-white'
                : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => {
          const inCart = cartItems.find((c) => c.equipmentId === item.id)
          const reachedLimit = (inCart?.quantity ?? 0) >= (item.available_count ?? 0)
          const dateChosen = item.available_count !== null

          return (
            <div
              key={item.id}
              className="group flex min-w-0 flex-col overflow-hidden rounded-lg bg-white ring-1 ring-zinc-200 transition hover:ring-blue-700/40 hover:shadow-sm"
            >
              <div className="flex h-28 items-center justify-center bg-blue-50 text-blue-800">
                <span className="flex size-14 items-center justify-center rounded-full border border-blue-800/15 bg-white/80">
                  <PackagePlus className="size-7" strokeWidth={1.6} aria-hidden="true" />
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="mb-3 flex min-h-6 items-center justify-between gap-2">
                  <span className="max-w-[55%] truncate rounded-sm bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-600">
                    {item.category_name}
                  </span>
                  {!dateChosen ? (
                    <span className="text-right text-[11px] font-medium text-zinc-400">Pilih tanggal</span>
                  ) : item.available_count! > 0 ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700">
                      <Check className="size-3.5" aria-hidden="true" />
                      {item.available_count} tersedia
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-rose-700">
                      Habis
                    </span>
                  )}
                </div>

                <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-zinc-900">
                  {item.name}
                </h3>
                <p className="mb-4 min-h-5 truncate text-sm text-zinc-500">
                  {[item.brand, item.size].filter(Boolean).join(' · ') || 'Detail belum tersedia'}
                </p>

                <div className="mt-auto flex items-end justify-between gap-2 border-t border-zinc-100 pt-3">
                  <p>
                    <span className="block text-lg font-extrabold leading-6 text-zinc-900">
                      Rp{Number(item.price_per_day).toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-zinc-500">per hari</span>
                  </p>
                  <button
                    disabled={!dateChosen || item.available_count === 0 || reachedLimit}
                    onClick={() =>
                      addItem({
                        equipmentId: item.id,
                        name: item.name,
                        categoryName: item.category_name,
                        pricePerDay: item.price_per_day,
                        maxAvailable: item.available_count ?? 0,
                      })
                    }
                    className="min-h-10 shrink-0 rounded-md bg-blue-800 px-3.5 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                  >
                    {inCart ? `+${inCart.quantity}` : 'Sewa'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="col-span-full rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">Belum ada alat di kategori ini.</p>
        )}
      </div>
    </div>
  )
}