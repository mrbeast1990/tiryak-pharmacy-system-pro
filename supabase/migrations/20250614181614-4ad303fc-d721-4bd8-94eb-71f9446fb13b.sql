
-- المرحلة 1: ترقية المستخدم الحالي إلى دور "مدير"
-- تحديث دور المستخدم صاحب البريد الإلكتروني 'deltanorthpharm@gmail.com' إلى 'admin'.
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'deltanorthpharm@gmail.com' LIMIT 1);

-- المرحلة 2: تحديث دالة إنشاء المستخدم لجعل المستخدم الجديد هو المدير الافتراضي
-- تعديل دالة handle_new_user لجعل 'deltanorthpharm@gmail.com' هو حساب المدير الرئيسي.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
  user_name TEXT;
BEGIN
  -- تعيين الدور والاسم بناءً على البريد الإلكتروني للمستخدم الجديد.
  CASE NEW.email
    WHEN 'deltanorthpharm@gmail.com' THEN -- تم التغيير هنا
      user_role := 'admin';
      user_name := 'المدير';
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
      -- لأي بريد إلكتروني آخر، يتم تعيين دور 'member' الافتراضي.
      user_role := 'member';
      user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  END CASE;

  -- إدراج الملف الشخصي الجديد في جدول public.profiles.
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, user_name, user_role);

  RETURN NEW;
END;
$$;
