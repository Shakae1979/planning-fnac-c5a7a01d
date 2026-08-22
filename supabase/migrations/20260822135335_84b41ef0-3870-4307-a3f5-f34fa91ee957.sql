ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS secondary_roles text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.employee_day_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);

GRANT SELECT ON public.employee_day_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_day_roles TO authenticated;
GRANT ALL ON public.employee_day_roles TO service_role;

ALTER TABLE public.employee_day_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_day_roles public read" ON public.employee_day_roles FOR SELECT TO public USING (true);
CREATE POLICY "employee_day_roles auth insert" ON public.employee_day_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "employee_day_roles auth update" ON public.employee_day_roles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "employee_day_roles auth delete" ON public.employee_day_roles FOR DELETE TO authenticated USING (true);