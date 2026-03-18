
-- Employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  contract_hours NUMERIC NOT NULL DEFAULT 36,
  role TEXT NOT NULL DEFAULT 'vendeur',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees are publicly readable" ON public.employees
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage employees" ON public.employees
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Weekly schedules table
CREATE TABLE public.weekly_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  lundi_start TEXT,
  lundi_end TEXT,
  mardi_start TEXT,
  mardi_end TEXT,
  mercredi_start TEXT,
  mercredi_end TEXT,
  jeudi_start TEXT,
  jeudi_end TEXT,
  vendredi_start TEXT,
  vendredi_end TEXT,
  samedi_start TEXT,
  samedi_end TEXT,
  dimanche_start TEXT,
  dimanche_end TEXT,
  hours_base NUMERIC DEFAULT 0,
  hours_modified NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, week_start)
);

ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedules are publicly readable" ON public.weekly_schedules
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage schedules" ON public.weekly_schedules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.weekly_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
