
-- Helper: staff = admin, manager, editor
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role, 'manager'::app_role, 'editor'::app_role)
  )
$$;

-- ============ conges ============
DROP POLICY IF EXISTS "Conges are publicly readable" ON public.conges;
DROP POLICY IF EXISTS "Authenticated can insert conges" ON public.conges;
DROP POLICY IF EXISTS "Authenticated can update conges" ON public.conges;
DROP POLICY IF EXISTS "Authenticated can delete conges" ON public.conges;
CREATE POLICY "conges_select_authenticated" ON public.conges FOR SELECT TO authenticated USING (true);
CREATE POLICY "conges_write_staff" ON public.conges FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
REVOKE ALL ON public.conges FROM anon;

-- ============ day_comments ============
DROP POLICY IF EXISTS "Day comments are publicly readable" ON public.day_comments;
DROP POLICY IF EXISTS "Authenticated can insert day_comments" ON public.day_comments;
DROP POLICY IF EXISTS "Authenticated can update day_comments" ON public.day_comments;
DROP POLICY IF EXISTS "Authenticated can delete day_comments" ON public.day_comments;
CREATE POLICY "day_comments_select_authenticated" ON public.day_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "day_comments_write_staff" ON public.day_comments FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
REVOKE ALL ON public.day_comments FROM anon;

-- ============ employee_day_flags ============
DROP POLICY IF EXISTS "employee_day_flags public read" ON public.employee_day_flags;
DROP POLICY IF EXISTS "employee_day_flags auth insert" ON public.employee_day_flags;
DROP POLICY IF EXISTS "employee_day_flags auth update" ON public.employee_day_flags;
DROP POLICY IF EXISTS "employee_day_flags auth delete" ON public.employee_day_flags;
CREATE POLICY "employee_day_flags_select_authenticated" ON public.employee_day_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "employee_day_flags_write_staff" ON public.employee_day_flags FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
REVOKE ALL ON public.employee_day_flags FROM anon;

-- ============ employee_day_roles ============
DROP POLICY IF EXISTS "employee_day_roles public read" ON public.employee_day_roles;
DROP POLICY IF EXISTS "employee_day_roles auth insert" ON public.employee_day_roles;
DROP POLICY IF EXISTS "employee_day_roles auth update" ON public.employee_day_roles;
DROP POLICY IF EXISTS "employee_day_roles auth delete" ON public.employee_day_roles;
CREATE POLICY "employee_day_roles_select_authenticated" ON public.employee_day_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "employee_day_roles_write_staff" ON public.employee_day_roles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
REVOKE ALL ON public.employee_day_roles FROM anon;

-- ============ schedule_role_overrides ============
DROP POLICY IF EXISTS "schedule_role_overrides public read" ON public.schedule_role_overrides;
DROP POLICY IF EXISTS "schedule_role_overrides auth insert" ON public.schedule_role_overrides;
DROP POLICY IF EXISTS "schedule_role_overrides auth update" ON public.schedule_role_overrides;
DROP POLICY IF EXISTS "schedule_role_overrides auth delete" ON public.schedule_role_overrides;
CREATE POLICY "schedule_role_overrides_select_authenticated" ON public.schedule_role_overrides FOR SELECT TO authenticated USING (true);
CREATE POLICY "schedule_role_overrides_write_staff" ON public.schedule_role_overrides FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
REVOKE ALL ON public.schedule_role_overrides FROM anon;

-- ============ employees ============
DROP POLICY IF EXISTS "Employees are publicly readable" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can manage employees" ON public.employees;
CREATE POLICY "employees_select_authenticated" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees_write_staff" ON public.employees FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
REVOKE ALL ON public.employees FROM anon;

-- ============ weekly_schedules ============
DROP POLICY IF EXISTS "Schedules are publicly readable" ON public.weekly_schedules;
DROP POLICY IF EXISTS "Authenticated users can manage schedules" ON public.weekly_schedules;
CREATE POLICY "weekly_schedules_select_authenticated" ON public.weekly_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "weekly_schedules_write_staff" ON public.weekly_schedules FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
REVOKE ALL ON public.weekly_schedules FROM anon;

-- Ensure authenticated grants remain
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conges, public.day_comments, public.employee_day_flags,
  public.employee_day_roles, public.schedule_role_overrides, public.employees, public.weekly_schedules TO authenticated;
GRANT ALL ON public.conges, public.day_comments, public.employee_day_flags,
  public.employee_day_roles, public.schedule_role_overrides, public.employees, public.weekly_schedules TO service_role;
