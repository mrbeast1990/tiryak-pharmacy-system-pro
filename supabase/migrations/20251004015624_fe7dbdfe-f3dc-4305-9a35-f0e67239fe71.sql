-- حذف السياسة القديمة للإضافة
DROP POLICY IF EXISTS "Authenticated users can insert medicines" ON medicines;

-- إنشاء سياسة جديدة تسمح للمستخدمين بإضافة أدوية مع بياناتهم
CREATE POLICY "Users can insert their own medicines"
ON medicines
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (updated_by_id = auth.uid() OR updated_by_id IS NULL)
);