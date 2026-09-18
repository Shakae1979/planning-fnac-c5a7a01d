-- 1. Restrict stores + store_settings reads to authenticated users
DROP POLICY IF EXISTS "Stores are publicly readable" ON public.stores;
CREATE POLICY "Stores readable by authenticated"
ON public.stores FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Store settings are publicly readable" ON public.store_settings;
CREATE POLICY "Store settings readable by authenticated"
ON public.store_settings FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.stores FROM anon;
REVOKE SELECT ON public.store_settings FROM anon;
GRANT SELECT ON public.stores TO authenticated;
GRANT SELECT ON public.store_settings TO authenticated;

-- 2. Prevent duplicate employee emails within a store (self-lookup policy safety)
CREATE UNIQUE INDEX IF NOT EXISTS employees_email_store_unique_idx
ON public.employees (lower(email), store_id)
WHERE email IS NOT NULL AND email <> '';

-- 3. Hours export functions are only for the secured edge function (service role)
REVOKE EXECUTE ON FUNCTION public.export_hours_weekly(date, date, uuid, uuid, boolean) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.export_hours_monthly(date, date, uuid, uuid, boolean) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.export_hours_weekly(date, date, uuid, uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.export_hours_monthly(date, date, uuid, uuid, boolean) TO service_role;

-- set_employee_order is a plain (invoker) helper used by staff UI: keep authenticated execute
GRANT EXECUTE ON FUNCTION public.set_employee_order(uuid[]) TO authenticated;