-- إضافة RLS policy للمديرين لحذف الإشعارات
CREATE POLICY "Admins can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- إضافة RLS policy للمديرين لحذف حالات قراءة الإشعارات
CREATE POLICY "Admins can delete notification read statuses" 
ON public.notification_read_status 
FOR DELETE 
USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));