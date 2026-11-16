DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit valid contact messages" ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (
  is_read = false
  AND length(btrim(name)) BETWEEN 1 AND 200
  AND length(btrim(email)) BETWEEN 3 AND 320 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(btrim(subject)) BETWEEN 1 AND 300
  AND length(btrim(message)) BETWEEN 1 AND 5000
  AND (attachment_url IS NULL OR length(attachment_url) <= 1000)
);