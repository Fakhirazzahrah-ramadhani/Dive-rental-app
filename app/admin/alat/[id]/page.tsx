import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import UnitsManager from './units-manager'

export default async function EquipmentUnitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: item } = await supabase
    .from('equipment')
    .select('id, name, brand, size, equipment_categories(name)')
    .eq('id', id)
    .single()

  if (!item) notFound()

  const { data: units } = await supabase
    .from('equipment_units')
    .select('id, unit_code, condition, status')
    .eq('equipment_id', id)
    .order('unit_code')

  const categoryName = (item.equipment_categories as unknown as { name: string } | null)?.name ?? '-'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← Kembali ke Daftar Alat
        </Link>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {categoryName}
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
          {item.name} {item.brand ? `· ${item.brand}` : ''} {item.size ? `· ${item.size}` : ''}
        </h2>
      </div>

      <UnitsManager equipmentId={item.id} units={units ?? []} />
    </div>
  )
}