export const CODE_REGEX = /^[A-Z0-9][A-Z0-9-]{1,29}$/

export const CODE_RULE_TEXT = 'Kode alat hanya boleh huruf, angka, dan tanda hubung (2–30 karakter).'

export function friendlyEquipmentError(error: { code?: string; message: string }) {
  if (error.code === '23505') return 'Kode alat ini sudah dipakai alat lain. Gunakan kode yang berbeda.'
  if (error.code === '23514') return CODE_RULE_TEXT
  return error.message
}