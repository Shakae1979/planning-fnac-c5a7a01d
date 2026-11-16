CREATE TABLE public.week_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  traffic_level text NOT NULL DEFAULT 'normal',
  summary text NOT NULL DEFAULT '',
  advice_next_year text NOT NULL DEFAULT '',
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.week_reviews TO authenticated;
GRANT ALL ON public.week_reviews TO service_role;
ALTER TABLE public.week_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY week_reviews_select ON public.week_reviews FOR SELECT TO authenticated USING (public.can_manage_store(store_id));
CREATE POLICY week_reviews_insert ON public.week_reviews FOR INSERT TO authenticated WITH CHECK (public.can_manage_store(store_id));
CREATE POLICY week_reviews_update ON public.week_reviews FOR UPDATE TO authenticated USING (public.can_manage_store(store_id)) WITH CHECK (public.can_manage_store(store_id));
CREATE POLICY week_reviews_delete ON public.week_reviews FOR DELETE TO authenticated USING (public.can_manage_store(store_id));
CREATE TRIGGER week_reviews_updated BEFORE UPDATE ON public.week_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();