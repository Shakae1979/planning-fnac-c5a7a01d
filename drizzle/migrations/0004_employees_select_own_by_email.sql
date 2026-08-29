CREATE POLICY employees_select_own_by_email
ON public.employees FOR SELECT TO authenticated
USING (email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'));