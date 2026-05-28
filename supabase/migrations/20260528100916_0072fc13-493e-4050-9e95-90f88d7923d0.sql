-- 1) Restrict anon's column access on employees: exclude email and must_change_password
REVOKE SELECT ON public.employees FROM anon;
GRANT SELECT (id, name, last_name, role, contract_hours, is_active, created_at, store_id)
  ON public.employees TO anon;

-- Make sure authenticated keeps full read access (all columns)
GRANT SELECT ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

-- 2) Add explicit INSERT policy on contact-attachments storage bucket (authenticated only)
DROP POLICY IF EXISTS "Authenticated can upload contact attachments" ON storage.objects;
CREATE POLICY "Authenticated can upload contact attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contact-attachments');