import { createClient } from '@supabase/supabase-js'

// PERINGATAN: file ini hanya boleh dipakai di kode server (API routes),
// TIDAK PERNAH di komponen client. Key ini melewati semua RLS.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}