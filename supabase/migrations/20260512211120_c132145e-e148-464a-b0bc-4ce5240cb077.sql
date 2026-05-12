
-- Restrict pharmacy_guide SELECT to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can view pharmacy guide" ON public.pharmacy_guide;
CREATE POLICY "Authenticated users can view pharmacy guide"
ON public.pharmacy_guide FOR SELECT
TO authenticated
USING (true);

-- Restrict supplies SELECT to authenticated only
DROP POLICY IF EXISTS "Authenticated users can view supplies" ON public.supplies;
CREATE POLICY "Authenticated users can view supplies"
ON public.supplies FOR SELECT
TO authenticated
USING (true);

-- Restrict supplies INSERT to authenticated only
DROP POLICY IF EXISTS "Authenticated users can insert supplies" ON public.supplies;
CREATE POLICY "Authenticated users can insert supplies"
ON public.supplies FOR INSERT
TO authenticated
WITH CHECK (true);

-- Restrict supplies UPDATE to authenticated only (was already public-role)
DROP POLICY IF EXISTS "Authenticated users can update supplies" ON public.supplies;
CREATE POLICY "Authenticated users can update supplies"
ON public.supplies FOR UPDATE
TO authenticated
USING (true);

-- Restrict periodic_notification_state UPDATE to admins only
DROP POLICY IF EXISTS "System can update periodic notification state" ON public.periodic_notification_state;
CREATE POLICY "Admins can update periodic notification state"
ON public.periodic_notification_state FOR UPDATE
TO authenticated
USING (public.get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]))
WITH CHECK (public.get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Tighten storage policies on revenue-attachments to require ownership
-- Files uploaded going forward will be at path: {auth.uid()}/{filename}
-- Legacy files (no folder) remain accessible to admins only via the admin policy
DROP POLICY IF EXISTS "Authenticated can view revenue attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload revenue attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update revenue attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete revenue attachments" ON storage.objects;

CREATE POLICY "Owners and admins can view revenue attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'revenue-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role])
  )
);

CREATE POLICY "Owners can upload revenue attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'revenue-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owners and admins can update revenue attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'revenue-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role])
  )
);

CREATE POLICY "Owners and admins can delete revenue attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'revenue-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role])
  )
);
