ALTER TABLE public.employee_day_roles
  ADD COLUMN IF NOT EXISTS start_time text,
  ADD COLUMN IF NOT EXISTS end_time text;

ALTER TABLE public.employee_day_roles
  DROP CONSTRAINT IF EXISTS employee_day_roles_employee_id_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS employee_day_roles_emp_date_start_key
  ON public.employee_day_roles (employee_id, date, COALESCE(start_time, ''));