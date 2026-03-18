CREATE POLICY "Public can delete schedules"
ON public.weekly_schedules FOR DELETE
TO public
USING (true);