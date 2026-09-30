import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import AddEquipmentForm from './add-equipment-form'
import EquipmentTable from './equipment-table'
import CategoryManager from './category-manager'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: categories } = await supabase
    .from('equipment_categories')
    .select('id, name')
    .order('name')

  const { data: rawEquipment } = await supabase
    .from('equipment')
    .select('id, name, brand, size, price_per_day, category_id, equipment_categories(name)')
    .order('name')

  const equipment = (rawEquipment ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    size: item.size,
    price_per_day: item.price_per_day,
    category_id: item.category_id,
    category_name: (item.equipment_categories as unknown as { name: string } | null)?.name ?? '-',
  }))

  return (
    <div className="flex flex-col gap-10">
      <section>
        <SectionHeader eyebrow="Pengaturan" title="Kategori Alat" />
        <CategoryManager categories={categories ?? []} />
      </section>

      <section>
        <SectionHeader eyebrow="Inventaris" title="Tambah Alat Baru" />
        <AddEquipmentForm categories={categories ?? []} />
      </section>

      <section>
        <SectionHeader eyebrow="Inventaris" title={`Daftar Alat (${equipment.length})`} />
        <EquipmentTable equipment={equipment} categories={categories ?? []} />
      </section>
    </div>
  )
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {eyebrow}
      </p>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
        {title}
      </h2>
    </div>
  )
}