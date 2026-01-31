CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  user_name TEXT;
  assigned_role_text TEXT;
BEGIN
  -- التحقق من وجود دور معين في metadata
  assigned_role_text := NEW.raw_user_meta_data->>'assigned_role';
  
  IF assigned_role_text IS NOT NULL AND assigned_role_text != '' THEN
    -- استخدام الدور المعين من الموافقة على طلب الحساب
    user_role := assigned_role_text::app_role;
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  ELSE
    -- المنطق الافتراضي للمستخدمين الموجودين
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
$$;