type BookingNotification = {
  bookingId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  startDate: string
  endDate: string
  totalPrice: number
  items: { name: string; unitCode: string }[]
}

type NotificationTask = { label: string; run: () => Promise<void> }

function isConfigured(value: string | undefined): value is string {
  const normalized = value?.trim()
  return Boolean(normalized && !/^(isi_|your_|placeholder|change[_-]?me)/i.test(normalized))
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

function formatDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatRupiah(value: number) {
  return `Rp${value.toLocaleString('id-ID')}`
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  return digits
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NOTIFICATION_FROM_EMAIL
  if (!apiKey || !from || !to) return

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) throw new Error(`Resend menolak email (${response.status}).`)
}

async function sendWhatsAppTemplate(to: string, templateName: string, parameters: string[]) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (![accessToken, phoneNumberId, to, templateName].every(isConfigured)) return

  const version = process.env.WHATSAPP_GRAPH_API_VERSION ?? 'v23.0'
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? 'id'
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizePhone(to),
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: [{
          type: 'body',
          parameters: parameters.map((text) => ({ type: 'text', text })),
        }],
      },
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) throw new Error(`WhatsApp Cloud API menolak pesan (${response.status}).`)
}

export async function sendBookingNotifications(booking: BookingNotification) {
  const shortId = booking.bookingId.slice(0, 8)
  const itemsText = booking.items.map((item) => `${item.name} (${item.unitCode})`).join(', ') || 'Detail alat belum tersedia'
  const period = `${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`
  const total = formatRupiah(booking.totalPrice)
  const safe = {
    name: escapeHtml(booking.customerName),
    email: escapeHtml(booking.customerEmail),
    phone: escapeHtml(booking.customerPhone || '-'),
    id: escapeHtml(shortId),
    items: escapeHtml(itemsText),
    period: escapeHtml(period),
    total: escapeHtml(total),
  }

  const customerHtml = `<h2>Booking Anda berhasil dibuat</h2><p>Halo ${safe.name}, booking <strong>#${safe.id}</strong> sudah tercatat.</p><p><strong>Perlengkapan:</strong> ${safe.items}</p><p><strong>Periode:</strong> ${safe.period}</p><p><strong>Total:</strong> ${safe.total}</p><p>Silakan buka Dive Rental untuk melanjutkan pembayaran.</p>`
  const adminHtml = `<h2>Booking baru masuk</h2><p><strong>ID:</strong> #${safe.id}</p><p><strong>Pelanggan:</strong> ${safe.name}</p><p><strong>Email:</strong> ${safe.email}</p><p><strong>Telepon:</strong> ${safe.phone}</p><p><strong>Perlengkapan:</strong> ${safe.items}</p><p><strong>Periode:</strong> ${safe.period}</p><p><strong>Total:</strong> ${safe.total}</p>`
  const tasks: NotificationTask[] = []
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL

  if (adminEmail) {
    tasks.push({
      label: 'email admin',
      run: () => sendEmail(adminEmail, `Booking baru #${shortId}`, adminHtml),
    })
  }
  if (booking.customerEmail) {
    tasks.push({
      label: 'email pelanggan',
      run: () => sendEmail(booking.customerEmail, `Booking #${shortId} berhasil dibuat`, customerHtml),
    })
  }

  const adminWhatsApp = process.env.ADMIN_WHATSAPP_TO
  const adminTemplate = process.env.WHATSAPP_ADMIN_TEMPLATE_NAME
  if (isConfigured(adminWhatsApp) && isConfigured(adminTemplate)) {
    tasks.push({
      label: 'WhatsApp admin',
      run: () => sendWhatsAppTemplate(adminWhatsApp, adminTemplate, [shortId, booking.customerName, booking.customerPhone || '-', itemsText, period, total]),
    })
  }

  const customerTemplate = process.env.WHATSAPP_CUSTOMER_TEMPLATE_NAME
  if (isConfigured(booking.customerPhone) && isConfigured(customerTemplate)) {
    tasks.push({
      label: 'WhatsApp pelanggan',
      run: () => sendWhatsAppTemplate(booking.customerPhone, customerTemplate, [shortId, itemsText, period, total]),
    })
  }

  await Promise.all(tasks.map(async (task) => {
    try {
      await task.run()
    } catch (error) {
      console.error(`Notifikasi ${task.label} gagal:`, error)
    }
  }))
}