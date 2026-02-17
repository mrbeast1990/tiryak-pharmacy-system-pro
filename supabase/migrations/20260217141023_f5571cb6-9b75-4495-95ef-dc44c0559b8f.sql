
-- Step 1: Add service_name column and abdulwahab enum value only
ALTER TABLE public.revenues ADD COLUMN IF NOT EXISTS service_name text;
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'abdulwahab';
