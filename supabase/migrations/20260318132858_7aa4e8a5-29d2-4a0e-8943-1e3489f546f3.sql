CREATE TABLE public.conges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'conge',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conges are publicly readable" ON public.conges FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert conges" ON public.conges FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update conges" ON public.conges FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete conges" ON public.conges FOR DELETE TO public USING (true);