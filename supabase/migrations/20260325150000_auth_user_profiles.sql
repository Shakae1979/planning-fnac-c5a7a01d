-- =============================================================
-- Authentification : table user_profiles + durcissement RLS
-- =============================================================

-- 1. Table des profils utilisateurs
CREATE TABLE public.user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'employee'
                CHECK (role IN ('admin', 'employee')),
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut lire son propre profil
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Fonction helper : vérifie si l'utilisateur courant est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 3. Durcissement des politiques RLS
--    Lecture publique conservée (pour les liens partagés)
--    Écriture réservée aux admins authentifiés

-- employees
DROP POLICY IF EXISTS "Public can update employees"   ON public.employees;
DROP POLICY IF EXISTS "Public can insert employees"   ON public.employees;
DROP POLICY IF EXISTS "Public can delete employees"   ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can manage employees" ON public.employees;

CREATE POLICY "Admin can manage employees"
  ON public.employees FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- weekly_schedules
DROP POLICY IF EXISTS "Public can insert schedules"   ON public.weekly_schedules;
DROP POLICY IF EXISTS "Public can update schedules"   ON public.weekly_schedules;
DROP POLICY IF EXISTS "Public can delete schedules"   ON public.weekly_schedules;
DROP POLICY IF EXISTS "Authenticated users can manage schedules" ON public.weekly_schedules;

CREATE POLICY "Admin can manage schedules"
  ON public.weekly_schedules FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- conges
DROP POLICY IF EXISTS "Public can insert conges" ON public.conges;
DROP POLICY IF EXISTS "Public can update conges" ON public.conges;
DROP POLICY IF EXISTS "Public can delete conges" ON public.conges;

CREATE POLICY "Admin can manage conges"
  ON public.conges FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- day_comments
DROP POLICY IF EXISTS "Public can insert day comments" ON public.day_comments;
DROP POLICY IF EXISTS "Public can update day comments" ON public.day_comments;
DROP POLICY IF EXISTS "Public can delete day comments" ON public.day_comments;

CREATE POLICY "Admin can manage day comments"
  ON public.day_comments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- schedule_role_overrides
DROP POLICY IF EXISTS "Allow all access to schedule_role_overrides" ON public.schedule_role_overrides;

CREATE POLICY "Schedules overrides are publicly readable"
  ON public.schedule_role_overrides FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage schedule_role_overrides"
  ON public.schedule_role_overrides FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- employee_day_flags
DROP POLICY IF EXISTS "Allow all access to employee_day_flags" ON public.employee_day_flags;

CREATE POLICY "Employee day flags are publicly readable"
  ON public.employee_day_flags FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage employee_day_flags"
  ON public.employee_day_flags FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
