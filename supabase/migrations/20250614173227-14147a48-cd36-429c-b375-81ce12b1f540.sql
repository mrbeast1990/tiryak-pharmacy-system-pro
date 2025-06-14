
-- المرحلة 1: إعداد أدوار المستخدمين وملفاتهم الشخصية
-- إنشاء نوع بيانات مخصص (ENUM) لأدوار المستخدمين لضمان الاتساق.
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'ahmad_rajili',
  'morning_shift',
  'evening_shift',
  'night_shift'
);

-- إنشاء جدول لتخزين الملفات الشخصية العامة للمستخدمين، بما في ذلك أدوارهم.
-- هذا الجدول مرتبط بجدول المصادقة الرئيسي في Supabase.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role public.app_role NOT NULL
);

-- إنشاء دالة تلقائية (trigger function) لإنشاء ملف شخصي للمستخدم
-- وتعيين دور له بناءً على بريده الإلكتروني عند التسجيل.
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
      -- إذا لم يتم التعرف على البريد الإلكتروني، يتم إيقاف العملية لمنع التسجيل غير المصرح به.
      RAISE EXCEPTION 'User email not recognized for role assignment: %', NEW.email;
  END CASE;

  -- إدراج الملف الشخصي الجديد في جدول public.profiles.
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, user_name, user_role);

  RETURN NEW;
END;
$$;

-- إنشاء trigger لتنفيذ دالة handle_new_user بعد إدراج مستخدم جديد في auth.users.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- دالة مساعدة للحصول على دور المستخدم المصادق عليه حاليًا.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- تفعيل سياسات الأمان على مستوى الصف (RLS) لجدول profiles.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- سياسة RLS: السماح للمستخدمين بعرض ملفاتهم الشخصية.
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- سياسة RLS: السماح للمدراء (admin و ahmad_rajili) بعرض جميع ملفات المستخدمين.
CREATE POLICY "Admins can view all profiles."
  ON public.profiles FOR SELECT
  USING (get_my_role() IN ('admin', 'ahmad_rajili'));


-- المرحلة 2: جدول الأدوية
-- إنشاء جدول لتخزين معلومات الأدوية والنواقص.
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'shortage')),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by_id UUID REFERENCES auth.users(id),
  updated_by_name TEXT,
  notes TEXT,
  repeat_count INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT medicine_name_unique UNIQUE (name)
);

-- تفعيل RLS لجدول الأدوية.
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول الأدوية.
CREATE POLICY "Authenticated users can view medicines" ON public.medicines FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert medicines" ON public.medicines FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update medicines" ON public.medicines FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete medicines" ON public.medicines FOR DELETE USING (get_my_role() IN ('admin', 'ahmad_rajili'));


-- المرحلة 3: جدول الإيرادات
-- إنشاء جدول لتخزين جميع الإيرادات والمصروفات المالية.
CREATE TABLE public.revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('morning', 'evening', 'night', 'ahmad_rajili')),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_by_id UUID NOT NULL REFERENCES auth.users(id),
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- تفعيل RLS لجدول الإيرادات.
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول الإيرادات.
CREATE POLICY "Admins can view all revenues" ON public.revenues FOR SELECT USING (get_my_role() IN ('admin', 'ahmad_rajili'));
CREATE POLICY "Shift users can view their own revenues" ON public.revenues FOR SELECT USING (
    (get_my_role() = 'morning_shift' AND period = 'morning') OR
    (get_my_role() = 'evening_shift' AND period = 'evening') OR
    (get_my_role() = 'night_shift' AND period = 'night')
);
CREATE POLICY "Users can insert revenues" ON public.revenues FOR INSERT WITH CHECK (
    created_by_id = auth.uid() AND (
      (get_my_role() = 'morning_shift' AND period = 'morning') OR
      (get_my_role() = 'evening_shift' AND period = 'evening') OR
      (get_my_role() = 'night_shift' AND period = 'night') OR
      (get_my_role() IN ('admin', 'ahmad_rajili'))
    )
  );
CREATE POLICY "Admins can update revenues" ON public.revenues FOR UPDATE USING (get_my_role() IN ('admin', 'ahmad_rajili'));
CREATE POLICY "Admins can delete revenues" ON public.revenues FOR DELETE USING (get_my_role() IN ('admin', 'ahmad_rajili'));

