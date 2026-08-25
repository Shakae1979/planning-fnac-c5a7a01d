DROP FUNCTION IF EXISTS public.get_my_stores();

CREATE OR REPLACE FUNCTION public.get_my_stores()
RETURNS TABLE(store_id uuid, store_name text, store_city text, store_is_direction boolean, store_has_lunch_break boolean, store_has_ab_weeks boolean, store_has_multi_roles boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT s.id, s.name, s.city, s.is_direction, s.has_lunch_break, s.has_ab_weeks, s.has_multi_roles
  FROM public.user_store_assignments usa
  JOIN public.stores s ON s.id = usa.store_id
  WHERE usa.user_id = auth.uid()
$function$;

ALTER TABLE public.stores DROP COLUMN IF EXISTS has_two_floors;
ALTER TABLE public.employees DROP COLUMN IF EXISTS floor;