'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type CartItem = {
  equipmentId: string
  name: string
  categoryName: string
  pricePerDay: number
  maxAvailable: number
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  updateQuantity: (equipmentId: string, quantity: number) => void
  removeItem: (equipmentId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)
const STORAGE_KEY = 'dive-rental-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setItems(JSON.parse(saved))
    } catch {
      // abaikan kalau localStorage tidak tersedia
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // abaikan
    }
  }, [items, hydrated])

  function addItem(item: Omit<CartItem, 'quantity'>) {
    setItems((prev) => {
      const existing = prev.find((i) => i.equipmentId === item.equipmentId)
      if (existing) {
        const nextQty = Math.min(existing.quantity + 1, item.maxAvailable)
        return prev.map((i) => (i.equipmentId === item.equipmentId ? { ...i, quantity: nextQty } : i))
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  function updateQuantity(equipmentId: string, quantity: number) {
    setItems((prev) =>
      prev
        .map((i) => (i.equipmentId === equipmentId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxAvailable)) } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  function removeItem(equipmentId: string) {
    setItems((prev) => prev.filter((i) => i.equipmentId !== equipmentId))
  }

  function clearCart() {
    setItems([])
  }

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart harus dipakai di dalam CartProvider')
  return ctx
}