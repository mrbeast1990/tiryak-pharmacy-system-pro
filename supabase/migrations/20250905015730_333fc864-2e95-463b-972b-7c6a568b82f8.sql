-- تفعيل pg_cron extension إذا لم تكن مفعلة
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- إنشاء cron job لحذف الإشعارات القديمة أسبوعياً
-- يعمل كل يوم أحد في الساعة 2:00 صباحاً
SELECT cron.schedule(
  'delete-old-notifications-weekly',
  '0 2 * * 0', -- كل يوم أحد في الساعة 2:00 صباحاً
  $$
  SELECT
    net.http_post(
        url:='https://qoyawkfbyocgtyxlpgnp.supabase.co/functions/v1/delete-old-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveWF3a2ZieW9jZ3R5eGxwZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTgyNTcsImV4cCI6MjA2NTQ5NDI1N30.8neVXjoVGgh-bcyL5f5FUZnRkJ4eVfaTvwvItpwmEKI"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);