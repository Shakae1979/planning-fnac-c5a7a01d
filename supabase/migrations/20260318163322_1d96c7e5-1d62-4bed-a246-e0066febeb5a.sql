CREATE TABLE public.day_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  day_key text NOT NULL,
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(week_start, day_key)
);

ALTER TABLE public.day_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Day comments are publicly readable" ON public.day_comments FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert day comments" ON public.day_comments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update day comments" ON public.day_comments FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete day comments" ON public.day_comments FOR DELETE TO public USING (true);