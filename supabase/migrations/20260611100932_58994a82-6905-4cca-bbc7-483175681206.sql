ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS has_lunch_break boolean NOT NULL DEFAULT false;

ALTER TABLE public.weekly_schedules
  ADD COLUMN IF NOT EXISTS lundi_break_start text,
  ADD COLUMN IF NOT EXISTS lundi_break_end text,
  ADD COLUMN IF NOT EXISTS mardi_break_start text,
  ADD COLUMN IF NOT EXISTS mardi_break_end text,
  ADD COLUMN IF NOT EXISTS mercredi_break_start text,
  ADD COLUMN IF NOT EXISTS mercredi_break_end text,
  ADD COLUMN IF NOT EXISTS jeudi_break_start text,
  ADD COLUMN IF NOT EXISTS jeudi_break_end text,
  ADD COLUMN IF NOT EXISTS vendredi_break_start text,
  ADD COLUMN IF NOT EXISTS vendredi_break_end text,
  ADD COLUMN IF NOT EXISTS samedi_break_start text,
  ADD COLUMN IF NOT EXISTS samedi_break_end text,
  ADD COLUMN IF NOT EXISTS dimanche_break_start text,
  ADD COLUMN IF NOT EXISTS dimanche_break_end text;