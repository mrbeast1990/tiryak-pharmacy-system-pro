
-- إنشاء جدول لتخزين طلبات الحسابات الجديدة
CREATE TABLE public.account_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- الحالات الممكنة: 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by_id UUID REFERENCES public.profiles(id),
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- تفعيل أمان على مستوى الصف (RLS)
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;

-- السماح لأي شخص بإرسال طلب إنشاء حساب جديد (من خلال صفحة التسجيل)
CREATE POLICY "Allow public access to create account requests"
ON public.account_requests
FOR INSERT
WITH CHECK (true);

-- السماح للمدراء بمشاهدة جميع الطلبات
CREATE POLICY "Admins can view all account requests"
ON public.account_requests
FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'ahmad_rajili')
);

-- السماح للمدراء بتحديث الطلبات (مثل تغيير الحالة)
CREATE POLICY "Admins can update account requests"
ON public.account_requests
FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'ahmad_rajili')
);

-- السماح للمدراء بحذف الطلبات
CREATE POLICY "Admins can delete account requests"
ON public.account_requests
FOR DELETE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'ahmad_rajili')
);
