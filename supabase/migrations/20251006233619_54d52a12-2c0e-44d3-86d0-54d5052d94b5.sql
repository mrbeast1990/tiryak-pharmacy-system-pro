-- إصلاح سياسة RLS للإدراج في جدول الأدوية
DROP POLICY IF EXISTS "Authenticated users can insert medicines" ON public.medicines;

-- إنشاء سياسة جديدة تسمح للمستخدمين المصادق عليهم بإضافة أدوية
CREATE POLICY "Authenticated users can insert medicines"
ON public.medicines
FOR INSERT
TO authenticated
WITH CHECK (true);