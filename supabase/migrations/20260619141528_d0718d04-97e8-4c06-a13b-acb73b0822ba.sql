DROP FUNCTION IF EXISTS public.get_my_stores();

CREATE OR REPLACE FUNCTION public.get_my_stores()
 RETURNS TABLE(store_id uuid, store_name text, store_city text, store_is_direction boolean, store_has_lunch_break boolean, store_has_ab_weeks boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.id, s.name, s.city, s.is_direction, s.has_lunch_break, s.has_ab_weeks
  FROM public.user_store_assignments usa
  JOIN public.stores s ON s.id = usa.store_id
  WHERE usa.user_id = auth.uid()
$function$;