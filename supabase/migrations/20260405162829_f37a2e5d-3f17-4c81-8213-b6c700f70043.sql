
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL UNIQUE,
  schedule_start_hour integer NOT NULL DEFAULT 9,
  schedule_end_hour integer NOT NULL DEFAULT 20,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store settings are publicly readable"
  ON public.store_settings FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can manage store settings"
  ON public.store_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
