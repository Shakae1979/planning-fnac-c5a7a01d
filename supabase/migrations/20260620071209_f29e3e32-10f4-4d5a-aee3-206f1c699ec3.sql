ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS employees_store_sort_idx ON public.employees (store_id, role, sort_order);