
-- stores: allow managers to update their assigned stores
DROP POLICY IF EXISTS "Editors can update assigned stores" ON public.stores;
CREATE POLICY "Editors and managers can update assigned stores"
ON public.stores FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = stores.id)
)
WITH CHECK (
  (has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = stores.id)
);

-- store_settings: same
DROP POLICY IF EXISTS "Editors can manage own store settings" ON public.store_settings;
CREATE POLICY "Editors and managers can manage own store settings"
ON public.store_settings FOR ALL TO authenticated
USING (
  (has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = store_settings.store_id)
)
WITH CHECK (
  (has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = store_settings.store_id)
);

-- contact_messages: extend read/update to managers
DROP POLICY IF EXISTS "Admins and editors can read contact messages" ON public.contact_messages;
CREATE POLICY "Admins, editors and managers can read contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
);

DROP POLICY IF EXISTS "Admins and editors can update contact messages" ON public.contact_messages;
CREATE POLICY "Admins, editors and managers can update contact messages"
ON public.contact_messages FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
);

-- storage: contact-attachments insert/select extended to managers
DROP POLICY IF EXISTS "Admins and editors can read contact attachments" ON storage.objects;
CREATE POLICY "Admins, editors and managers can read contact attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'contact-attachments' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'editor'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
  )
);
