create table if not exists public.cash_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('income', 'expense')),
  category text not null default 'lainnya' check (category in ('booking', 'maintenance', 'operasional', 'lainnya')),
  amount numeric(12,2) not null check (amount > 0),
  description text not null default 'Catatan kas',
  note text,
  reference text,
  updated_at timestamptz default now()
);

create index if not exists idx_cash_records_created_at
  on public.cash_records (created_at desc);

create index if not exists idx_cash_records_type_category
  on public.cash_records (type, category);

alter table public.cash_records
  enable row level security;

create policy "Admins can view cash records"
  on public.cash_records
  for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can insert cash records"
  on public.cash_records
  for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can update cash records"
  on public.cash_records
  for update
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can delete cash records"
  on public.cash_records
  for delete
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
