ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS has_two_floors boolean NOT NULL DEFAULT false;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS floor smallint NOT NULL DEFAULT 1;
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_floor_check;
ALTER TABLE public.employees ADD CONSTRAINT employees_floor_check CHECK (floor IN (1,2));