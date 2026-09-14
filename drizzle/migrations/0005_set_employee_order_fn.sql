CREATE OR REPLACE FUNCTION public.set_employee_order(_ids uuid[])
RETURNS void
LANGUAGE sql
SET search_path TO 'public'
AS $$
  UPDATE public.employees e
  SET sort_order = o.idx - 1
  FROM unnest(_ids) WITH ORDINALITY AS o(id, idx)
  WHERE e.id = o.id;
$$;

GRANT EXECUTE ON FUNCTION public.set_employee_order(uuid[]) TO authenticated;