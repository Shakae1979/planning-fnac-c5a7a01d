
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_stores() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_stores() TO authenticated, service_role;
