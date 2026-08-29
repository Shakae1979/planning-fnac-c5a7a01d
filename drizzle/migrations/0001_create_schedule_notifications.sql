CREATE TABLE public.schedule_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_notifications TO authenticated;
GRANT ALL ON public.schedule_notifications TO service_role;

ALTER TABLE public.schedule_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_notifications_select_scoped"
ON public.schedule_notifications FOR SELECT TO authenticated
USING (public.can_view_employee(employee_id));

CREATE POLICY "schedule_notifications_write_staff"
ON public.schedule_notifications FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "schedule_notifications_mark_read_own"
ON public.schedule_notifications FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    JOIN auth.users u ON lower(u.email) = lower(e.email)
    WHERE e.id = schedule_notifications.employee_id
      AND u.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    JOIN auth.users u ON lower(u.email) = lower(e.email)
    WHERE e.id = schedule_notifications.employee_id
      AND u.id = auth.uid()
  )
);

CREATE TABLE public.notified_schedule_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  snapshot_hash TEXT NOT NULL,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, week_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notified_schedule_snapshots TO authenticated;
GRANT ALL ON public.notified_schedule_snapshots TO service_role;

ALTER TABLE public.notified_schedule_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notified_snapshots_select_scoped"
ON public.notified_schedule_snapshots FOR SELECT TO authenticated
USING (public.can_view_employee(employee_id));

CREATE POLICY "notified_snapshots_write_staff"
ON public.notified_schedule_snapshots FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));