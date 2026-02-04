-- Add scientific_name column to medicines table
ALTER TABLE public.medicines
ADD COLUMN scientific_name TEXT DEFAULT NULL;