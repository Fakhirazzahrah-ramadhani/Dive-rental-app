'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Waves } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'masuk' | 'daftar'>('masuk')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'daftar') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${location.origin}/auth/confirm`,
        },
      })
      if (error) {
        setMessage(error.message)
      } else if (data.session) {
        router.push('/')
        router.refresh()
      } else {
        setMessage('Pendaftaran berhasil. Cek email kamu untuk konfirmasi.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f4f8fc] lg:grid lg:grid-cols-[minmax(320px,0.9fr)_1.1fr]">
      <section className="flex flex-col justify-between bg-blue-950 px-5 py-5 text-white sm:px-8 sm:py-7 lg:min-h-screen lg:px-12 lg:py-10">
        <Link href="/" className="inline-flex w-fit items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <span className="flex size-10 items-center justify-center rounded-full bg-white/10">
            <Waves className="size-5" aria-hidden="true" />
          </span>
          <span className="font-(family-name:--font-heading) text-lg font-extrabold">Dive Rental</span>
        </Link>
        <div className="mt-8 max-w-lg lg:mt-0">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-sky-200">Selamat datang</p>
          <h2 className="font-(family-name:--font-heading) text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
            Siapkan perjalanan menyelam Anda.
          </h2>
          <p className="mt-3 hidden max-w-md text-sm leading-6 text-sky-100 sm:block">
            Masuk atau buat akun untuk melanjutkan ke Dive Rental.
          </p>
        </div>
      </section>

      <section className="flex min-h-[70vh] items-center justify-center px-5 py-9 sm:px-8 lg:min-h-screen lg:px-12">
        <div className="w-full max-w-md">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-800">Akun Dive Rental</p>
          <h1 className="font-(family-name:--font-heading) text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
            {mode === 'masuk' ? 'Masuk ke akun Anda' : 'Buat akun baru'}
          </h1>
          <p className="mt-2 mb-7 text-sm leading-6 text-zinc-600">
            {mode === 'masuk' ? 'Gunakan email dan kata sandi yang terdaftar.' : 'Isi data berikut untuk membuat akun.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'daftar' && (
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-zinc-700" htmlFor="login-name">
                Nama lengkap
                <input
                  id="login-name"
                  autoComplete="name"
                    className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-zinc-700" htmlFor="login-email">
              Email
              <input
                id="login-email"
                autoComplete="email"
                className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-zinc-700" htmlFor="login-password">
              Kata sandi
              <input
                id="login-password"
                autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'}
                className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-1 min-h-11 rounded-md bg-blue-800 px-4 text-sm font-bold text-white transition hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Memproses...' : mode === 'masuk' ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          {message && <p className="mt-4 wrap-break-word rounded-md border border-blue-800/15 bg-blue-50 px-3 py-2.5 text-sm leading-5 text-blue-950" role="status" aria-live="polite">{message}</p>}

          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-medium text-zinc-400">atau</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <button
            type="button"
            disabled={googleLoading}
            onClick={async () => {
              try {
                setGoogleLoading(true)
                setMessage(null)
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${location.origin}/auth/confirm` },
                })

                if (error) {
                  setMessage(error.message)
                }
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Gagal masuk dengan Google.'
                setMessage(message)
              } finally {
                setGoogleLoading(false)
              }
            }}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5C29.4 34.8 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C40.9 36.2 44 30.6 44 24c0-1.3-.1-2.7-.4-3.5z" />
            </svg>
            {googleLoading ? 'Mengarahkan...' : 'Masuk dengan Google'}
          </button>

          <p className="mt-6 text-center text-sm text-zinc-600">
            {mode === 'masuk' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'masuk' ? 'daftar' : 'masuk')
                setMessage(null)
              }}
              className="font-bold text-blue-800 underline decoration-blue-800/40 underline-offset-4 hover:text-blue-950"
            >
              {mode === 'masuk' ? 'Daftar' : 'Masuk'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}