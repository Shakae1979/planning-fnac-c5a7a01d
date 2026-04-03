
DROP FUNCTION IF EXISTS public.get_my_stores();

CREATE FUNCTION public.get_my_stores()
 RETURNS TABLE(store_id uuid, store_name text, store_city text, store_is_direction boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT s.id, s.name, s.city, s.is_direction
  FROM public.user_store_assignments usa
  JOIN public.stores s ON s.id = usa.store_id
  WHERE usa.user_id = auth.uid()
$$;
