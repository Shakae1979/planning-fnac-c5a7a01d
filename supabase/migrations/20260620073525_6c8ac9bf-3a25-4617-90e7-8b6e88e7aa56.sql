
-- 1) Restrict contact-attachments uploads to staff with a role
DROP POLICY IF EXISTS "Authenticated can upload contact attachments" ON storage.objects;

CREATE POLICY "Staff can upload contact attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contact-attachments'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'editor'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  )
);

-- 2) Revoke sensitive employees columns from anon while keeping public-readable safe columns
REVOKE SELECT ON public.employees FROM anon;
GRANT SELECT (
  id, name, last_name, role, contract_hours, is_active,
  sort_order, store_id, created_at, is_cadre
) ON public.employees TO anon;
