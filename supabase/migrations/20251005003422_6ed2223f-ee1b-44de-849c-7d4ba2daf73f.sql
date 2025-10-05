-- إصلاح سياسة RLS للسماح بإضافة الأدوية
DROP POLICY IF EXISTS "Users can insert their own medicines" ON public.medicines;

-- إنشاء سياسة جديدة تسمح لجميع المستخدمين المصادق عليهم بإضافة أدوية
CREATE POLICY "Authenticated users can insert medicines"
ON public.medicines
FOR INSERT
TO authenticated
WITH CHECK (true);