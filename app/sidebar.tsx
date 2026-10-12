'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './logout-button'

const navItems = [
  { href: '/', label: 'Katalog', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { href: '/my-bookings', label: 'Booking Saya', icon: 'M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z' },
]

export default function Sidebar({
  isAdmin,
  isLoggedIn,
  userName,
}: {
  isAdmin: boolean
  isLoggedIn: boolean
  userName: string | null
}) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-100 bg-white px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-800 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v13M5 13c0-4 3-6 7-6s7 2 7 6" />
          </svg>
        </div>
        <span className="text-base font-bold text-zinc-900">Dive Rental</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems
          .filter((item) => item.href !== '/my-bookings' || isLoggedIn)
          .map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? 'bg-blue-50 text-blue-900' : 'text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            )
          })}

        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              pathname.startsWith('/admin') ? 'bg-blue-50 text-blue-900' : 'text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
            Panel Admin
          </Link>
        )}
      </nav>

      <div className="mt-auto border-t border-zinc-100 pt-4">
        {isLoggedIn ? (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
                {(userName ?? '?').charAt(0).toUpperCase()}
              </div>
              <p className="max-w-[110px] truncate text-sm font-medium text-zinc-700">{userName}</p>
            </div>
            <LogoutButton />
          </div>
        ) : (
          <Link href="/login" className="block rounded-lg bg-blue-800 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-900">
            Masuk
          </Link>
        )}
      </div>
    </aside>
  )
}