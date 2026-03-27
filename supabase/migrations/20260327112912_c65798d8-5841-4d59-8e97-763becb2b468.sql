
-- 1. Add 'editor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';

-- 2. Create stores table
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Everyone can read stores
CREATE POLICY "Stores are publicly readable" ON public.stores FOR SELECT TO public USING (true);
-- Only admins can manage stores
CREATE POLICY "Admins can manage stores" ON public.stores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Add store_id to employees
ALTER TABLE public.employees ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

-- 4. Create user_store_assignments (links auth users to stores)
CREATE TABLE public.user_store_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id)
);
ALTER TABLE public.user_store_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage store assignments" ON public.user_store_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read own store assignments" ON public.user_store_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 5. Insert Charleroi as first store
INSERT INTO public.stores (id, name, city) VALUES ('00000000-0000-0000-0000-000000000001', 'Fnac Charleroi', 'Charleroi');

-- 6. Assign all existing employees to Charleroi
UPDATE public.employees SET store_id = '00000000-0000-0000-0000-000000000001';

-- 7. Function to get user's stores
CREATE OR REPLACE FUNCTION public.get_my_stores()
RETURNS TABLE(store_id uuid, store_name text, store_city text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT s.id, s.name, s.city
  FROM public.user_store_assignments usa
  JOIN public.stores s ON s.id = usa.store_id
  WHERE usa.user_id = auth.uid()
$$;
