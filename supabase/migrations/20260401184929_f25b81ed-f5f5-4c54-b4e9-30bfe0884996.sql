CREATE POLICY "Users can update their own revenues"
ON public.revenues FOR UPDATE
TO authenticated
USING (created_by_id = auth.uid());