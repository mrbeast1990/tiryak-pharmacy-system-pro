-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create pharmacy_guide table for Al-Tiryak Guide
CREATE TABLE public.pharmacy_guide (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  concentration TEXT,
  origin TEXT,
  pharmacist_notes TEXT,
  keywords TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pharmacy_guide ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view
CREATE POLICY "Authenticated users can view pharmacy guide"
ON public.pharmacy_guide
FOR SELECT
USING (true);

-- Policy: Admins can insert
CREATE POLICY "Admins can insert pharmacy guide"
ON public.pharmacy_guide
FOR INSERT
WITH CHECK (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Policy: Admins can update
CREATE POLICY "Admins can update pharmacy guide"
ON public.pharmacy_guide
FOR UPDATE
USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Policy: Admins can delete
CREATE POLICY "Admins can delete pharmacy guide"
ON public.pharmacy_guide
FOR DELETE
USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Create index for faster search
CREATE INDEX idx_pharmacy_guide_trade_name ON public.pharmacy_guide USING gin(to_tsvector('arabic', trade_name));
CREATE INDEX idx_pharmacy_guide_scientific_name ON public.pharmacy_guide USING gin(to_tsvector('arabic', scientific_name));
CREATE INDEX idx_pharmacy_guide_keywords ON public.pharmacy_guide USING gin(keywords);

-- Create trigger for updated_at
CREATE TRIGGER update_pharmacy_guide_updated_at
BEFORE UPDATE ON public.pharmacy_guide
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();