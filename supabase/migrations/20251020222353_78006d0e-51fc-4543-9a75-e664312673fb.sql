-- Create notifications_log table to store notification history
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'system', -- 'system', 'shortage', 'general'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all notification logs
CREATE POLICY "Admins can view all notification logs"
ON public.notifications_log
FOR SELECT
USING (get_my_role() = ANY(ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Allow authenticated users to view notification logs
CREATE POLICY "Authenticated users can view notification logs"
ON public.notifications_log
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_log_sent_at ON public.notifications_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_log_type ON public.notifications_log(notification_type);