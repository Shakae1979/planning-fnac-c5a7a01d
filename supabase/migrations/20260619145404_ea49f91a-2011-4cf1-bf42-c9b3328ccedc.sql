CREATE POLICY "Editors can update assigned stores"
ON public.stores FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'editor'::app_role) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = stores.id)
)
WITH CHECK (
  has_role(auth.uid(), 'editor'::app_role) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = stores.id)
);

CREATE POLICY "Editors can manage own store settings"
ON public.store_settings FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'editor'::app_role) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = store_settings.store_id)
)
WITH CHECK (
  has_role(auth.uid(), 'editor'::app_role) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = store_settings.store_id)
);