-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'bank')),
  notes TEXT,
  attachment_url TEXT,
  is_deducted BOOLEAN NOT NULL DEFAULT false,
  deducted_at TIMESTAMP WITH TIME ZONE,
  deducted_by_id UUID,
  deducted_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_id UUID NOT NULL,
  created_by_name TEXT NOT NULL
);

-- Create companies table for quick selection
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admin can delete payments"
  ON public.payments FOR DELETE
  USING (get_my_role() = 'admin'::app_role);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Admins can view companies"
  ON public.companies FOR SELECT
  USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can insert companies"
  ON public.companies FOR INSERT
  WITH CHECK (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can update companies"
  ON public.companies FOR UPDATE
  USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admin can delete companies"
  ON public.companies FOR DELETE
  USING (get_my_role() = 'admin'::app_role);

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false);

-- Storage policies for payment receipts
CREATE POLICY "Admins can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-receipts' AND
    get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role])
  );

CREATE POLICY "Admins can view receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-receipts' AND
    get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role])
  );

CREATE POLICY "Admins can delete receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'payment-receipts' AND
    get_my_role() = 'admin'::app_role
  );