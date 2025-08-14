-- إنشاء مستخدم جديد وملف شخصي بصلاحيات المدير
-- أولاً، دعنا نحدث دالة handle_new_user لتدعم البريد الإلكتروني الجديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  user_name TEXT;
BEGIN
  CASE NEW.email
    WHEN 'deltanorthpharm@gmail.com' THEN
      user_role := 'admin';
      user_name := 'المدير';
    WHEN 'thepanaceapharmacy@gmail.com' THEN
      user_role := 'admin';
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

  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, user_name, user_role);

  RETURN NEW;
END;
$function$;