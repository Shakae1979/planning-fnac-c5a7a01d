CREATE TABLE public.employee_day_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  socloz boolean NOT NULL DEFAULT false,
  sav boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, employee_id)
);

ALTER TABLE public.employee_day_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to employee_day_flags" ON public.employee_day_flags FOR ALL TO public USING (true) WITH CHECK (true);