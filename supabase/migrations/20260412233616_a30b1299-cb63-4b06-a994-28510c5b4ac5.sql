
-- Create accountant_verifications table
CREATE TABLE public.accountant_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  period TEXT NOT NULL,
  target_user_id UUID NOT NULL,
  reported_amount NUMERIC NOT NULL,
  verified_by_id UUID NOT NULL,
  verified_by_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX idx_accountant_verifications_unique 
  ON public.accountant_verifications (date, period, target_user_id);

-- Enable RLS
ALTER TABLE public.accountant_verifications ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can view verifications"
  ON public.accountant_verifications FOR SELECT
  USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can insert verifications"
  ON public.accountant_verifications FOR INSERT
  WITH CHECK (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can update verifications"
  ON public.accountant_verifications FOR UPDATE
  USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can delete verifications"
  ON public.accountant_verifications FOR DELETE
  USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Authenticated users can view verifications for their own records
CREATE POLICY "Users can view their own verifications"
  ON public.accountant_verifications FOR SELECT
  USING (target_user_id = auth.uid());
