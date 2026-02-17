
-- Update RLS policies for revenues to include abdulwahab
DROP POLICY IF EXISTS "Shift users can view their own revenues" ON public.revenues;
CREATE POLICY "Shift users can view their own revenues"
ON public.revenues
FOR SELECT
USING (
  ((get_my_role() = 'morning_shift'::app_role) AND (period = 'morning'::text))
  OR ((get_my_role() = 'evening_shift'::app_role) AND (period = 'evening'::text))
  OR ((get_my_role() = 'night_shift'::app_role) AND (period = 'night'::text))
  OR ((get_my_role() = 'abdulwahab'::app_role) AND (period = 'abdulwahab'::text))
);

DROP POLICY IF EXISTS "Users can insert revenues" ON public.revenues;
CREATE POLICY "Users can insert revenues"
ON public.revenues
FOR INSERT
WITH CHECK (
  (created_by_id = auth.uid()) AND (
    ((get_my_role() = 'morning_shift'::app_role) AND (period = 'morning'::text))
    OR ((get_my_role() = 'evening_shift'::app_role) AND (period = 'evening'::text))
    OR ((get_my_role() = 'night_shift'::app_role) AND (period = 'night'::text))
    OR ((get_my_role() = 'abdulwahab'::app_role) AND (period = 'abdulwahab'::text))
    OR (get_my_role() = 'admin'::app_role)
    OR (get_my_role() = 'ahmad_rajili'::app_role)
  )
);

-- Update handle_new_user to support abdulwahab
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  user_name TEXT;
  assigned_role_text TEXT;
BEGIN
  assigned_role_text := NEW.raw_user_meta_data->>'assigned_role';
  
  IF assigned_role_text IS NOT NULL AND assigned_role_text != '' THEN
    user_role := assigned_role_text::app_role;
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  ELSE
    CASE NEW.email
      WHEN 'deltanorthpharm@gmail.com' THEN
        user_role := 'admin';
        user_name := 'المدير';
      WHEN 'thepanaceapharmacy@gmail.com' THEN
        user_role := 'ahmad_rajili';
        user_name := 'أحمد الرجيلي';
      WHEN 'ahmad@tiryak.com' THEN
        user_role := 'ahmad_rajili';
        user_name := 'أحمد الرجيلي';
      WHEN 'morning@tiryak.com' THEN
        user_role := 'morning_shift';
        user_name := 'الفترة الصباحية';
      WHEN 'evening@tiryak.com' THEN
        user_role := 'evening_shift';
        user_name := 'الفترة المسائية';
      WHEN 'night@tiryak.com' THEN
        user_role := 'night_shift';
        user_name := 'الفترة الليلية';
      ELSE
        user_role := 'member';
        user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    END CASE;
  END IF;

  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, user_name, user_role);

  RETURN NEW;
END;
$function$;
