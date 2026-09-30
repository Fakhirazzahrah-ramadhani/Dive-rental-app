'use client'

import { useState } from 'react'
import { useCart } from './cart-context'

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('semua')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeCategory === 'semua'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-50'
          }`}
        >
          Semua
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeCategory === c.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => {
          const inCart = cartItems.find((c) => c.equipmentId === item.id)
          const reachedLimit = (inCart?.quantity ?? 0) >= (item.available_count ?? 0)
          const dateChosen = item.available_count !== null

          return (
            <div
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md"
            >
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6.5 8a5.5 5.5 0 0 1 11 0v3.5a5.5 5.5 0 0 1-11 0Z" />
                  <path d="M9 8h6" />
                  <circle cx="12" cy="4" r="1.3" fill="#2563eb" />
                </svg>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
                    {item.category_name}
                  </span>
                  {!dateChosen ? (
                    <span className="text-xs font-medium text-zinc-400">Pilih tanggal</span>
                  ) : item.available_count! > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {item.available_count} tersedia
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Habis
                    </span>
                  )}
                </div>

                <h3 className="font-[family-name:var(--font-heading)] text-base font-bold text-zinc-900">
                  {item.name}
                </h3>
                <p className="mb-4 text-sm text-zinc-400">
                  {item.brand ?? '-'} {item.size ? `· ${item.size}` : ''}
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <p>
                    <span className="font-[family-name:var(--font-heading)] text-xl font-extrabold text-zinc-900">
                      Rp{Number(item.price_per_day).toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs font-medium text-zinc-400"> /hari</span>
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
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
                  >
                    {inCart ? `+${inCart.quantity}` : 'Sewa'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-zinc-400">Belum ada alat di kategori ini.</p>
        )}
      </div>
    </div>
  )
}