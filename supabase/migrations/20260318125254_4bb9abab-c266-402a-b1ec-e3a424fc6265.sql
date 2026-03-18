
-- Allow public (anon) to insert, update, delete on weekly_schedules
CREATE POLICY "Public can insert schedules"
ON public.weekly_schedules FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can update schedules"
ON public.weekly_schedules FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow public (anon) to update employees (for toggle active)
CREATE POLICY "Public can update employees"
ON public.employees FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can insert employees"
ON public.employees FOR INSERT
TO public
WITH CHECK (true);
