ALTER TABLE public.day_comments ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

UPDATE public.day_comments SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;