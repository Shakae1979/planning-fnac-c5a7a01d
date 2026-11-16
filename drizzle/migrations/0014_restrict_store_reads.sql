DROP POLICY IF EXISTS "Stores readable by authenticated" ON public.stores;
CREATE POLICY "Stores readable by allowed users" ON public.stores FOR SELECT TO authenticated
USING (public.can_view_store(id) OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id IN (SELECT public.my_employee_ids()) AND e.store_id = stores.id));
DROP POLICY IF EXISTS "Store settings readable by authenticated" ON public.store_settings;
CREATE POLICY "Store settings readable by allowed users" ON public.store_settings FOR SELECT TO authenticated
USING (public.can_view_store(store_id) OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id IN (SELECT public.my_employee_ids()) AND e.store_id = store_settings.store_id));