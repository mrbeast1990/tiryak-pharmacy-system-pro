-- Add new columns to companies table for representative info
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS representative_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT;