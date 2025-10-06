-- تحديث سياسة RLS للسماح بعرض جميع الأدوية للمستخدمين المصادق عليهم
DROP POLICY IF EXISTS "Authenticated users can view medicines" ON public.medicines;

CREATE POLICY "Authenticated users can view medicines"
ON public.medicines
FOR SELECT
TO authenticated
USING (true);