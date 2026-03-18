-- Delete Sunday rows where a Monday row already exists for the same employee
DELETE FROM public.weekly_schedules ws1
WHERE EXTRACT(DOW FROM ws1.week_start) = 0
  AND ws1.week_start != '1970-01-05'
  AND EXISTS (
    SELECT 1 FROM public.weekly_schedules ws2
    WHERE ws2.employee_id = ws1.employee_id
      AND ws2.week_start = ws1.week_start + INTERVAL '1 day'
  );

-- Shift remaining Sunday rows to Monday
UPDATE public.weekly_schedules
SET week_start = week_start + INTERVAL '1 day'
WHERE EXTRACT(DOW FROM week_start) = 0
  AND week_start != '1970-01-05';