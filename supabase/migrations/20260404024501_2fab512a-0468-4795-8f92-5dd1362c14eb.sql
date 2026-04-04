
-- Add verification fields to revenues
ALTER TABLE public.revenues ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.revenues ADD COLUMN IF NOT EXISTS verified_by_name text;

-- Create revenue_locks table for period locking
CREATE TABLE public.revenue_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  period text NOT NULL,
  locked_by_id uuid NOT NULL,
  locked_by_name text NOT NULL,
  locked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(date, period)
);

ALTER TABLE public.revenue_locks ENABLE ROW LEVEL SECURITY;

-- Only admins can manage locks
CREATE POLICY "Admins can view locks" ON public.revenue_locks
  FOR SELECT TO public USING (get_my_role() = ANY(ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can insert locks" ON public.revenue_locks
  FOR INSERT TO public WITH CHECK (get_my_role() = ANY(ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can delete locks" ON public.revenue_locks
  FOR DELETE TO public USING (get_my_role() = ANY(ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- All authenticated users can see locks (to know if their shift is locked)
CREATE POLICY "Auth users can view locks" ON public.revenue_locks
  FOR SELECT TO authenticated USING (true);
