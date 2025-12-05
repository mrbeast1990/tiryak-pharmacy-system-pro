-- Add company column to medicines table
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS company text;