-- Create table to track periodic notification state
CREATE TABLE IF NOT EXISTS public.periodic_notification_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_message_index INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial state
INSERT INTO public.periodic_notification_state (current_message_index, last_sent_at)
VALUES (0, NULL)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.periodic_notification_state ENABLE ROW LEVEL SECURITY;

-- Only admins can view and update this table
CREATE POLICY "Admins can view periodic notification state"
ON public.periodic_notification_state
FOR SELECT
USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "System can update periodic notification state"
ON public.periodic_notification_state
FOR UPDATE
USING (true);

-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;