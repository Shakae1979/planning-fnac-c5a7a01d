REVOKE ALL ON FUNCTION public.get_my_stores() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_stores() TO authenticated, service_role;