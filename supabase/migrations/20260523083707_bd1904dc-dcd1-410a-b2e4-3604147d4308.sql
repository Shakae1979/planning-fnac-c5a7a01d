
-- Restrict write operations to authenticated users on previously public-writable tables
-- Keep public SELECT where the app exposes read-only views (e.g., /conges)

-- conges
DROP POLICY IF EXISTS "Public can delete conges" ON public.conges;
DROP POLICY IF EXISTS "Public can insert conges" ON public.conges;
DROP POLICY IF EXISTS "Public can update conges" ON public.conges;
CREATE POLICY "Authenticated can insert conges" ON public.conges FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update conges" ON public.conges FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete conges" ON public.conges FOR DELETE TO authenticated USING (true);

-- day_comments
DROP POLICY IF EXISTS "Public can delete day comments" ON public.day_comments;
DROP POLICY IF EXISTS "Public can insert day comments" ON public.day_comments;
DROP POLICY IF EXISTS "Public can update day comments" ON public.day_comments;
CREATE POLICY "Authenticated can insert day_comments" ON public.day_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update day_comments" ON public.day_comments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete day_comments" ON public.day_comments FOR DELETE TO authenticated USING (true);

-- employee_day_flags: replace ALL public with SELECT public + writes authenticated
DROP POLICY IF EXISTS "Allow all access to employee_day_flags" ON public.employee_day_flags;
CREATE POLICY "employee_day_flags public read" ON public.employee_day_flags FOR SELECT TO public USING (true);
CREATE POLICY "employee_day_flags auth insert" ON public.employee_day_flags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "employee_day_flags auth update" ON public.employee_day_flags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "employee_day_flags auth delete" ON public.employee_day_flags FOR DELETE TO authenticated USING (true);

-- schedule_role_overrides
DROP POLICY IF EXISTS "Allow all access to schedule_role_overrides" ON public.schedule_role_overrides;
CREATE POLICY "schedule_role_overrides public read" ON public.schedule_role_overrides FOR SELECT TO public USING (true);
CREATE POLICY "schedule_role_overrides auth insert" ON public.schedule_role_overrides FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "schedule_role_overrides auth update" ON public.schedule_role_overrides FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "schedule_role_overrides auth delete" ON public.schedule_role_overrides FOR DELETE TO authenticated USING (true);

-- weekly_schedules
DROP POLICY IF EXISTS "Public can delete schedules" ON public.weekly_schedules;
DROP POLICY IF EXISTS "Public can insert schedules" ON public.weekly_schedules;
DROP POLICY IF EXISTS "Public can update schedules" ON public.weekly_schedules;

-- employees: keep public SELECT (used by public /conges view to show names) but restrict writes
DROP POLICY IF EXISTS "Public can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Public can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Public can update employees" ON public.employees;

-- store_settings: restrict writes to admins only
DROP POLICY IF EXISTS "Authenticated users can manage store settings" ON public.store_settings;
CREATE POLICY "Admins can manage store settings" ON public.store_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- contact-attachments storage: restrict upload to authenticated (was anonymous)
DROP POLICY IF EXISTS "Anyone can upload contact attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload contact attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can insert contact attachments" ON storage.objects;
