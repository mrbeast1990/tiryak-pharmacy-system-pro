
-- This migration updates the admin user's name to 'مدير'
UPDATE public.profiles
SET name = 'مدير'
WHERE id = (SELECT id FROM auth.users WHERE email = 'deltanorthpharm@gmail.com' LIMIT 1);
