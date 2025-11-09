-- إنشاء جدول المستلزمات
CREATE TABLE public.supplies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by_id UUID,
  updated_by_name TEXT,
  repeat_count INTEGER DEFAULT 1
);

-- تفعيل Row Level Security
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول (نفس سياسات medicines)
CREATE POLICY "Authenticated users can view supplies"
ON public.supplies
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert supplies"
ON public.supplies
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update supplies"
ON public.supplies
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete supplies"
ON public.supplies
FOR DELETE
USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- إضافة الجدول إلى Realtime
ALTER TABLE public.supplies REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplies;