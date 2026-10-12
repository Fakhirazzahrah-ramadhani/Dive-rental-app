'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { useCart } from './cart-context'

const subscribe = () => () => {}
const getMountedSnapshot = () => true
const getServerSnapshot = () => false

export default function FloatingCartButton() {
  const { items } = useCart()
  const mounted = useSyncExternalStore(subscribe, getMountedSnapshot, getServerSnapshot)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalQuantity = mounted ? items.reduce((sum, i) => sum + i.quantity, 0) : 0

  // sembunyikan tombol ini di halaman keranjang itu sendiri, admin, dan login
  const hiddenOn = ['/cart', '/login']
  if (hiddenOn.includes(pathname) || pathname.startsWith('/admin')) return null

  const cartParams = new URLSearchParams()
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  if (start) cartParams.set('start', start)
  if (end) cartParams.set('end', end)
  const cartQuery = cartParams.toString()

  return (
    <Link
      href={cartQuery ? `/cart?${cartQuery}` : '/cart'}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-800 text-white shadow-lg transition hover:bg-blue-900 hover:scale-105"
      aria-label="Buka keranjang"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>

      {totalQuantity > 0 && (
        <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
          {totalQuantity}
        </span>
      )}
    </Link>
  )
}