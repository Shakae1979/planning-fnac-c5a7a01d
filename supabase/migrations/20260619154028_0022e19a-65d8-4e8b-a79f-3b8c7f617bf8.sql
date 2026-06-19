
DROP POLICY IF EXISTS "Editors and managers can update assigned stores" ON public.stores;
CREATE POLICY "Managers can update assigned stores"
ON public.stores FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = stores.id)
)
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = stores.id)
);

DROP POLICY IF EXISTS "Editors and managers can manage own store settings" ON public.store_settings;
CREATE POLICY "Managers can manage own store settings"
ON public.store_settings FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = store_settings.store_id)
)
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = store_settings.store_id)
);
