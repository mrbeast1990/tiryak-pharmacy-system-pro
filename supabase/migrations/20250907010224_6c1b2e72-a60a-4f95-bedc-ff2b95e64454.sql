-- إنشاء مهمة لحذف الإشعارات القديمة (أكثر من أسبوع)
DELETE FROM public.notification_read_status 
WHERE notification_id IN (
  SELECT id FROM public.notifications 
  WHERE created_at < (NOW() - INTERVAL '7 days')
);

DELETE FROM public.notifications 
WHERE created_at < (NOW() - INTERVAL '7 days');