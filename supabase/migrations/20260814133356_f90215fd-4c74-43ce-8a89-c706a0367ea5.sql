CREATE TABLE public.assistant_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'Europe/Brussels')::date,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, day)
);
GRANT SELECT ON public.assistant_usage TO authenticated;
GRANT ALL ON public.assistant_usage TO service_role;
ALTER TABLE public.assistant_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own assistant usage" ON public.assistant_usage FOR SELECT TO authenticated USING (user_id = auth.uid());