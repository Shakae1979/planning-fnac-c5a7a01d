ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS external_code integer;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stores_external_code_key') THEN
    ALTER TABLE public.stores ADD CONSTRAINT stores_external_code_key UNIQUE (external_code);
  END IF;
END $$;

UPDATE public.stores SET external_code = 1  WHERE id = '4212b165-f9be-43a6-a1a6-24a9ddbfac41';
UPDATE public.stores SET external_code = 2  WHERE id = '83dc3741-e52a-45d8-b1dc-2bab9b148d7a';
UPDATE public.stores SET external_code = 7  WHERE id = '06f4df34-71bb-49ac-bc85-e8e91e690136';
UPDATE public.stores SET external_code = 9  WHERE id = 'bc4ce4e1-62a6-4ea0-a671-d5169a9211fc';
UPDATE public.stores SET external_code = 10 WHERE id = '0d2f4916-d243-4d72-bcfe-db24c7a7cab9';
UPDATE public.stores SET external_code = 11 WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE public.stores SET external_code = 12 WHERE id = '3742386a-e25a-4066-bc2a-b81fab9bd545';
UPDATE public.stores SET external_code = 14 WHERE id = 'df34b950-9380-4444-937a-6c816947c9c0';

-- Heures nettes d'une semaine, miroir de src/lib/hours.ts
CREATE OR REPLACE FUNCTION public.calc_week_net_hours(_schedule jsonb)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  d text;
  days text[] := ARRAY['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
  s text; e text; bs text; be text;
  gross numeric := 0;
  breaks numeric := 0;
  day_gross numeric;
  pause numeric;
BEGIN
  IF _schedule IS NULL THEN RETURN 0; END IF;
  FOREACH d IN ARRAY days LOOP
    s := _schedule ->> (d || '_start');
    e := _schedule ->> (d || '_end');
    IF s IS NOT NULL AND e IS NOT NULL AND s NOT IN ('EXT','ROULEMENT') THEN
      BEGIN
        day_gross := EXTRACT(EPOCH FROM (e::time - s::time)) / 3600.0;
      EXCEPTION WHEN OTHERS THEN
        day_gross := 0;
      END;
      IF day_gross IS NULL OR day_gross < 0 THEN day_gross := 0; END IF;
      gross := gross + day_gross;
      bs := _schedule ->> (d || '_break_start');
      be := _schedule ->> (d || '_break_end');
      IF bs IS NOT NULL AND be IS NOT NULL THEN
        BEGIN
          pause := EXTRACT(EPOCH FROM (be::time - bs::time)) / 3600.0;
        EXCEPTION WHEN OTHERS THEN
          pause := 0;
        END;
        IF pause IS NULL OR pause < 0 THEN pause := 0; END IF;
        breaks := breaks + pause;
      ELSIF day_gross >= 6 THEN
        breaks := breaks + 1;
      END IF;
    END IF;
  END LOOP;
  RETURN GREATEST(gross - breaks, 0);
END;
$$;

-- Export hebdomadaire
CREATE OR REPLACE FUNCTION public.export_hours_weekly(
  _from date,
  _to date,
  _store_code integer DEFAULT NULL,
  _employee_id uuid DEFAULT NULL,
  _include_inactive boolean DEFAULT false
)
RETURNS TABLE (
  employee_id uuid,
  name text,
  last_name text,
  email text,
  store_code integer,
  store_name text,
  contract_hours numeric,
  week_start date,
  hours_worked numeric,
  hours_gap numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id,
    e.name,
    e.last_name,
    e.email,
    s.external_code,
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
    AND (_store_code IS NULL OR s.external_code = _store_code)
    AND (_employee_id IS NULL OR e.id = _employee_id)
  ORDER BY s.external_code NULLS LAST, e.name, e.last_name, w.week_start
$$;

-- Export mensuel (mois planning : semaines dont le lundi tombe dans le mois)
CREATE OR REPLACE FUNCTION public.export_hours_monthly(
  _from date,
  _to date,
  _store_code integer DEFAULT NULL,
  _employee_id uuid DEFAULT NULL,
  _include_inactive boolean DEFAULT false
)
RETURNS TABLE (
  employee_id uuid,
  name text,
  last_name text,
  email text,
  store_code integer,
  store_name text,
  contract_hours numeric,
  month text,
  weeks_count integer,
  month_worked numeric,
  month_contract numeric,
  month_gap numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    SELECT e.*, s.external_code, s.name AS store_name
    FROM public.employees e
    LEFT JOIN public.stores s ON s.id = e.store_id
    WHERE (_include_inactive OR e.is_active)
      AND (_store_code IS NULL OR s.external_code = _store_code)
      AND (_employee_id IS NULL OR e.id = _employee_id)
  )
  SELECT
    emp.id,
    emp.name,
    emp.last_name,
    emp.email,
    emp.external_code,
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
  GROUP BY emp.id, emp.name, emp.last_name, emp.email, emp.external_code, emp.store_name, emp.contract_hours, mo.month_start
  ORDER BY emp.external_code NULLS LAST, emp.name, emp.last_name, to_char(mo.month_start, 'YYYY-MM')
$$;

REVOKE ALL ON FUNCTION public.export_hours_weekly(date, date, integer, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.export_hours_monthly(date, date, integer, uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.export_hours_weekly(date, date, integer, uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.export_hours_monthly(date, date, integer, uuid, boolean) TO service_role;