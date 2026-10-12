import CartClientPage from './cart-client'

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string | string[]; end?: string | string[] }>
}) {
  const { start, end } = await searchParams

  return (
    <CartClientPage
      initialStartDate={Array.isArray(start) ? start[0] ?? '' : start ?? ''}
      initialEndDate={Array.isArray(end) ? end[0] ?? '' : end ?? ''}
    />
  )
}