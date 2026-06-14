
CREATE POLICY "Admins and editors can update contact attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'contact-attachments' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')))
WITH CHECK (bucket_id = 'contact-attachments' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins and editors can delete contact attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'contact-attachments' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));
