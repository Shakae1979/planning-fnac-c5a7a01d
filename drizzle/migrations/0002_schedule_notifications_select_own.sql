CREATE POLICY "schedule_notifications_select_own"
ON public.schedule_notifications FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    JOIN auth.users u ON lower(u.email) = lower(e.email)
    WHERE e.id = schedule_notifications.employee_id
      AND u.id = auth.uid()
  )
);