
-- Add attachment columns to revenues
ALTER TABLE public.revenues
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS voice_note_url text;

-- Allow users to delete their own non-verified revenues
CREATE POLICY "Users can delete their own non-verified revenues"
ON public.revenues
FOR DELETE
TO authenticated
USING (created_by_id = auth.uid() AND is_verified = false);

-- Create storage bucket for revenue attachments (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('revenue-attachments', 'revenue-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload, view, and delete files in this bucket
CREATE POLICY "Authenticated can upload revenue attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'revenue-attachments');

CREATE POLICY "Authenticated can view revenue attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'revenue-attachments');

CREATE POLICY "Authenticated can update revenue attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'revenue-attachments');

CREATE POLICY "Authenticated can delete revenue attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'revenue-attachments');
