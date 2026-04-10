-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (submit contact form)
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (true);

-- Authenticated admins/editors can read all messages
CREATE POLICY "Admins and editors can read contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')
);

-- Admins/editors can update (mark as read)
CREATE POLICY "Admins and editors can update contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')
);

-- Admins can delete
CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('contact-attachments', 'contact-attachments', true);

-- Anyone can upload to contact-attachments
CREATE POLICY "Anyone can upload contact attachments"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'contact-attachments');

-- Anyone can view contact attachments (public bucket)
CREATE POLICY "Anyone can view contact attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'contact-attachments');