-- Fix RLS policies for medicines table
DROP POLICY IF EXISTS "Authenticated users can insert medicines" ON public.medicines;

CREATE POLICY "Authenticated users can insert medicines"
ON public.medicines
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix RLS policies for revenues table
DROP POLICY IF EXISTS "Users can insert revenues" ON public.revenues;

CREATE POLICY "Users can insert revenues"
ON public.revenues
FOR INSERT
TO authenticated
WITH CHECK (
  created_by_id = auth.uid() AND
  (
    (get_my_role() = 'morning_shift' AND period = 'morning') OR
    (get_my_role() = 'evening_shift' AND period = 'evening') OR
    (get_my_role() = 'night_shift' AND period = 'night') OR
    (get_my_role() = 'admin') OR
    (get_my_role() = 'ahmad_rajili')
  )
);