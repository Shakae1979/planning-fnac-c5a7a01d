DROP FUNCTION IF EXISTS public.export_hours_weekly(date, date, integer, uuid, boolean);
DROP FUNCTION IF EXISTS public.export_hours_monthly(date, date, integer, uuid, boolean);

CREATE FUNCTION public.export_hours_weekly(_from date, _to date, _store_id uuid DEFAULT NULL::uuid, _employee_id uuid DEFAULT NULL::uuid, _include_inactive boolean DEFAULT false)
RETURNS TABLE(employee_id uuid, name text, last_name text, email text, store_id uuid, store_name text, contract_hours numeric, week_start date, hours_worked numeric, hours_gap numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    e.id,
    e.name,
    e.last_name,
    e.email,
    e.store_id,
    s.name,
    e.contract_hours,
    w.week_start,
    ROUND(COALESCE(NULLIF(w.hours_modified, 0), public.calc_week_net_hours(to_jsonb(w)))::numeric, 2),
    ROUND((COALESCE(NULLIF(w.hours_modified, 0), public.calc_week_net_hours(to_jsonb(w))) - e.contract_hours)::numeric, 2)
  FROM public.weekly_schedules w
  JOIN public.employees e ON e.id = w.employee_id
  LEFT JOIN public.stores s ON s.id = e.store_id
  WHERE w.week_start >= _from
    AND w.week_start <= _to
    AND (_include_inactive OR e.is_active)
    AND (_store_id IS NULL OR e.store_id = _store_id)
    AND (_employee_id IS NULL OR e.id = _employee_id)
  ORDER BY s.name NULLS LAST, e.name, e.last_name, w.week_start
$function$;

CREATE FUNCTION public.export_hours_monthly(_from date, _to date, _store_id uuid DEFAULT NULL::uuid, _employee_id uuid DEFAULT NULL::uuid, _include_inactive boolean DEFAULT false)
RETURNS TABLE(employee_id uuid, name text, last_name text, email text, store_id uuid, store_name text, contract_hours numeric, month text, weeks_count integer, month_worked numeric, month_contract numeric, month_gap numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH months AS (
    SELECT generate_series(date_trunc('month', _from::timestamp), date_trunc('month', _to::timestamp), interval '1 month')::date AS m
  ),
  mondays AS (
    SELECT m.m AS month_start,
           d::date AS week_start
    FROM months m
    CROSS JOIN LATERAL generate_series(m.m::timestamp, (m.m + interval '1 month - 1 day')::timestamp, interval '1 day') d
    WHERE EXTRACT(ISODOW FROM d) = 1
  ),
  emp AS (
    SELECT e.*, s.name AS store_name
    FROM public.employees e
    LEFT JOIN public.stores s ON s.id = e.store_id
    WHERE (_include_inactive OR e.is_active)
      AND (_store_id IS NULL OR e.store_id = _store_id)
      AND (_employee_id IS NULL OR e.id = _employee_id)
  )
  SELECT
    emp.id,
    emp.name,
    emp.last_name,
    emp.email,
    emp.store_id,
    emp.store_name,
    emp.contract_hours,
    to_char(mo.month_start, 'YYYY-MM'),
    COUNT(*)::integer,
    ROUND(COALESCE(SUM(COALESCE(NULLIF(w.hours_modified, 0), public.calc_week_net_hours(to_jsonb(w)))), 0)::numeric, 2),
    ROUND((emp.contract_hours * COUNT(*))::numeric, 2),
    ROUND((COALESCE(SUM(COALESCE(NULLIF(w.hours_modified, 0), public.calc_week_net_hours(to_jsonb(w)))), 0) - emp.contract_hours * COUNT(*))::numeric, 2)
  FROM emp
  CROSS JOIN (SELECT DISTINCT month_start, week_start FROM mondays) mo
  LEFT JOIN public.weekly_schedules w ON w.employee_id = emp.id AND w.week_start = mo.week_start
  GROUP BY emp.id, emp.name, emp.last_name, emp.email, emp.store_id, emp.store_name, emp.contract_hours, mo.month_start
  ORDER BY emp.store_name NULLS LAST, emp.name, emp.last_name, to_char(mo.month_start, 'YYYY-MM')
$function$;

REVOKE ALL ON FUNCTION public.export_hours_weekly(date, date, uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.export_hours_monthly(date, date, uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.export_hours_weekly(date, date, uuid, uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.export_hours_monthly(date, date, uuid, uuid, boolean) TO service_role;