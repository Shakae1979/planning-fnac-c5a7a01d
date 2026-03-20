CREATE TABLE public.schedule_role_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  slot_key TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, employee_id, slot_key)
);

ALTER TABLE public.schedule_role_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to schedule_role_overrides"
ON public.schedule_role_overrides
FOR ALL
USING (true)
WITH CHECK (true);