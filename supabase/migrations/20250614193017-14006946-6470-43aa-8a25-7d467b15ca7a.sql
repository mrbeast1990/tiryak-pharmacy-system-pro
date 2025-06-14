
-- Table 1: To store the content of notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient TEXT NOT NULL, -- Can be a role like 'morning_shift' or a special value like 'all'.
  sender_id UUID NOT NULL REFERENCES public.profiles(id)
);
COMMENT ON COLUMN public.notifications.recipient IS 'Can be a role name (e.g., morning_shift) or ''all'' for everyone.';

-- Table 2: To track the read status for each user and notification
CREATE TABLE public.notification_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(notification_id, user_id)
);

-- Enable Row Level Security on both tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_read_status ENABLE ROW LEVEL SECURITY;

-- Policies for `notifications` table
-- Admins and ahmad_rajili can create notifications.
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT
WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'ahmad_rajili') );

-- A user can read a notification if an entry exists for them in the read_status table.
CREATE POLICY "Users can read notifications intended for them" ON public.notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.notification_read_status
    WHERE notification_read_status.notification_id = notifications.id AND notification_read_status.user_id = auth.uid()
  )
);

-- Policies for `notification_read_status` table
-- Users can read their own notification statuses.
CREATE POLICY "Users can read their own notification statuses" ON public.notification_read_status FOR SELECT
USING ( user_id = auth.uid() );

-- Users can update their own statuses (e.g., to mark as read).
CREATE POLICY "Users can update their own notification statuses" ON public.notification_read_status FOR UPDATE
USING ( user_id = auth.uid() );

-- Add the `notification_read_status` table to the realtime publication
-- This allows clients to listen for new notifications in real-time.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_read_status;

