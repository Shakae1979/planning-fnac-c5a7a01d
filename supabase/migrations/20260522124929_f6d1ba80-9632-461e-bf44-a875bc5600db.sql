create table public.ferie_credits (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  date date not null,
  hours numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, date)
);

alter table public.ferie_credits enable row level security;

create policy "Ferie credits are publicly readable"
  on public.ferie_credits for select using (true);

create policy "Authenticated can insert ferie credits"
  on public.ferie_credits for insert to authenticated with check (true);

create policy "Authenticated can update ferie credits"
  on public.ferie_credits for update to authenticated using (true) with check (true);

create policy "Authenticated can delete ferie credits"
  on public.ferie_credits for delete to authenticated using (true);

create trigger update_ferie_credits_updated_at
  before update on public.ferie_credits
  for each row execute function public.update_updated_at_column();

create index idx_ferie_credits_employee_date on public.ferie_credits(employee_id, date);