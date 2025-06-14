
-- المرحلة 1: إضافة دور جديد
-- إضافة دور 'member' إلى قائمة الأدوار المتاحة. هذا الدور سيُستخدم كدور افتراضي للمستخدمين الجدد
-- الذين لا يتطابق بريدهم الإلكتروني مع قائمة الموظفين المحددة مسبقًا.
ALTER TYPE public.app_role ADD VALUE 'member';

-- المرحلة 2: تحديث دالة إنشاء المستخدم
-- تعديل دالة handle_new_user لتعيين دور 'member' الافتراضي للمستخدمين الجدد
-- بدلاً من رفض إنشائهم. هذا يحل مشكلة إضافة مستخدمين جدد من لوحة التحكم
-- ويمهد الطريق لتفعيل ميزة قبول الطلبات.
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
    WHEN 'admin@tiryak.com' THEN
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
      -- سيتم استخدام الاسم الكامل من بيانات المستخدم الوصفية إذا كانت متاحة.
      user_role := 'member';
      user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  END CASE;

  -- إدراج الملف الشخصي الجديد في جدول public.profiles.
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, user_name, user_role);

  RETURN NEW;
END;
$$;
