import { createClient } from '@/utils/supabase/client'

const BUCKET = 'equipment-images'
const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export function validateImage(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return 'Format gambar harus JPG, PNG, atau WebP.'
  if (file.size > MAX_SIZE) return 'Ukuran gambar maksimal 2 MB.'
  return null
}

export async function uploadEquipmentImage(file: File): Promise<{ url?: string; error?: string }> {
  const invalid = validateImage(file)
  if (invalid) return { error: invalid }

  const supabase = createClient()
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
  })
  if (error) return { error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}

export async function removeEquipmentImage(url: string | null) {
  if (!url) return
  const marker = `/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const path = url.slice(idx + marker.length)
  await createClient().storage.from(BUCKET).remove([path])
}