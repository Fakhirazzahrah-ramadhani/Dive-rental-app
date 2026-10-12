'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: { onSuccess: () => void; onPending: () => void; onError: () => void; onClose: () => void }) => void
    }
  }
}

export default function PayButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!)
    script.onload = () => setScriptReady(true)
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  async function handlePay() {
    setLoading(true)
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      alert(data.message ?? 'Gagal memulai pembayaran.')
      return
    }

    window.snap.pay(data.token, {
      onSuccess: () => window.location.reload(),
      onPending: () => window.location.reload(),
      onError: () => alert('Pembayaran gagal, coba lagi.'),
      onClose: () => {},
    })
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading || !scriptReady}
      className="min-h-11 w-full rounded-md bg-blue-800 px-4 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Memproses...' : 'Bayar Sekarang'}
    </button>
  )
}