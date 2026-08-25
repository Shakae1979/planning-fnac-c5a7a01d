CREATE OR REPLACE FUNCTION public.can_view_store(_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    CASE
      WHEN _store_id IS NULL THEN
        public.has_role(auth.uid(), 'admin'::app_role) OR public.is_staff(auth.uid())
      ELSE
        public.has_role(auth.uid(), 'admin'::app_role)
        OR EXISTS (
          SELECT 1 FROM public.user_store_assignments usa
          WHERE usa.user_id = auth.uid() AND usa.store_id = _store_id
        )
        OR EXISTS (
          SELECT 1 FROM public.user_store_assignments usa
          JOIN public.stores s ON s.id = usa.store_id
          WHERE usa.user_id = auth.uid() AND s.is_direction
        )
    END
$$;

REVOKE ALL ON FUNCTION public.can_view_store(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_view_store(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_view_employee(_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = _employee_id AND public.can_view_store(e.store_id)
  )
$$;

REVOKE ALL ON FUNCTION public.can_view_employee(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_view_employee(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS employees_select_authenticated ON public.employees;
CREATE POLICY employees_select_scoped ON public.employees
  FOR SELECT TO authenticated
  USING (public.can_view_store(store_id));

DROP POLICY IF EXISTS conges_select_authenticated ON public.conges;
CREATE POLICY conges_select_scoped ON public.conges
  FOR SELECT TO authenticated
  USING (public.can_view_employee(employee_id));

DROP POLICY IF EXISTS weekly_schedules_select_authenticated ON public.weekly_schedules;
CREATE POLICY weekly_schedules_select_scoped ON public.weekly_schedules
  FOR SELECT TO authenticated
  USING (public.can_view_employee(employee_id));

DROP POLICY IF EXISTS employee_day_flags_select_authenticated ON public.employee_day_flags;
CREATE POLICY employee_day_flags_select_scoped ON public.employee_day_flags
  FOR SELECT TO authenticated
  USING (public.can_view_employee(employee_id));

DROP POLICY IF EXISTS employee_day_roles_select_authenticated ON public.employee_day_roles;
CREATE POLICY employee_day_roles_select_scoped ON public.employee_day_roles
  FOR SELECT TO authenticated
  USING (public.can_view_employee(employee_id));

DROP POLICY IF EXISTS schedule_role_overrides_select_authenticated ON public.schedule_role_overrides;
CREATE POLICY schedule_role_overrides_select_scoped ON public.schedule_role_overrides
  FOR SELECT TO authenticated
  USING (public.can_view_employee(employee_id));

DROP POLICY IF EXISTS day_comments_select_authenticated ON public.day_comments;
CREATE POLICY day_comments_select_scoped ON public.day_comments
  FOR SELECT TO authenticated
  USING (public.can_view_store(store_id));