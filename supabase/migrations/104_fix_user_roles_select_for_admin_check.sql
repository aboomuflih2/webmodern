ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_auth_select" ON public.user_roles;
CREATE POLICY "user_roles_auth_select" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.user_roles TO authenticated;
