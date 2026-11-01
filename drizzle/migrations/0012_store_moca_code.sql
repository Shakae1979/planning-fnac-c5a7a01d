ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS moca_code text;
CREATE UNIQUE INDEX IF NOT EXISTS stores_moca_code_key ON public.stores(moca_code) WHERE moca_code IS NOT NULL;
UPDATE public.stores SET moca_code='5904' WHERE id='00000000-0000-0000-0000-000000000001';