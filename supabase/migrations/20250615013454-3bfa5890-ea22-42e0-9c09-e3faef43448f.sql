
UPDATE public.profiles
SET name = 'المدير'
WHERE id = (SELECT id FROM auth.users WHERE email = 'deltanorthpharm@gmail.com' LIMIT 1);
