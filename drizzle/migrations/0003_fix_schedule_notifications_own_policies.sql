DROP POLICY IF EXISTS schedule_notifications_select_own ON public.schedule_notifications;
DROP POLICY IF EXISTS schedule_notifications_mark_read_own ON public.schedule_notifications;

CREATE POLICY schedule_notifications_select_own
ON public.schedule_notifications FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = schedule_notifications.employee_id
    AND e.email IS NOT NULL
    AND lower(e.email) = lower(auth.jwt() ->> 'email')
));

CREATE POLICY schedule_notifications_mark_read_own
ON public.schedule_notifications FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = schedule_notifications.employee_id
    AND e.email IS NOT NULL
    AND lower(e.email) = lower(auth.jwt() ->> 'email')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = schedule_notifications.employee_id
    AND e.email IS NOT NULL
    AND lower(e.email) = lower(auth.jwt() ->> 'email')
));