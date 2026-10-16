ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS has_budget boolean NOT NULL DEFAULT false;
ALTER TABLE public.day_comments ADD COLUMN IF NOT EXISTS budget text NOT NULL DEFAULT '';