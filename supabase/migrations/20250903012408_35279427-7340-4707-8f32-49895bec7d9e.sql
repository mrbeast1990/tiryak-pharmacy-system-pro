-- First, ensure the notifications table exists with proper structure
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient TEXT NOT NULL,
  sender_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure notification_read_status table exists
CREATE TABLE IF NOT EXISTS public.notification_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_read_status ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
DROP POLICY IF EXISTS "Users can view notifications sent to their role" ON public.notifications;
CREATE POLICY "Users can view notifications sent to their role" 
ON public.notifications 
FOR SELECT 
USING (
  recipient = 'all' OR 
  recipient = (SELECT role::text FROM public.profiles WHERE id = auth.uid())
);

-- Create policies for notification_read_status
DROP POLICY IF EXISTS "Users can view their own read status" ON public.notification_read_status;
CREATE POLICY "Users can view their own read status" 
ON public.notification_read_status 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own read status" ON public.notification_read_status;
CREATE POLICY "Users can update their own read status" 
ON public.notification_read_status 
FOR UPDATE 
USING (user_id = auth.uid());

-- Enable real-time updates
ALTER TABLE public.notification_read_status REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_read_status;

-- Create the notification function (recreate to ensure it works)
CREATE OR REPLACE FUNCTION public.send_notification_to_role(
  p_title text, 
  p_message text, 
  p_recipient_role text, 
  p_sender_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (title, message, recipient, sender_id)
  VALUES (p_title, p_message, p_recipient_role, p_sender_id)
  RETURNING id INTO v_notification_id;

  IF p_recipient_role = 'all' THEN
    INSERT INTO public.notification_read_status (notification_id, user_id)
    SELECT v_notification_id, id FROM public.profiles;
  ELSE
    INSERT INTO public.notification_read_status (notification_id, user_id)
    SELECT v_notification_id, id FROM public.profiles WHERE role::text = p_recipient_role;
  END IF;

  RETURN v_notification_id;
END;
$$;

-- Create function to notify admins when shortage is added
CREATE OR REPLACE FUNCTION public.notify_admin_on_shortage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  shortage_user_name TEXT;
BEGIN
  -- Only proceed if this is a shortage status medicine
  IF NEW.status = 'shortage' THEN
    -- Get the user name who added the shortage
    shortage_user_name := COALESCE(NEW.updated_by_name, 'مستخدم غير معروف');
    
    -- Send notification to admins
    PERFORM public.send_notification_to_role(
      'نقص جديد في المخزون',
      'تم تسجيل نقص جديد في صنف: ' || NEW.name || ' بواسطة ' || shortage_user_name || ' في ' || to_char(NEW.last_updated, 'YYYY-MM-DD HH24:MI'),
      'admin',
      NEW.updated_by_id
    );
    
    -- Also send to ahmad_rajili
    PERFORM public.send_notification_to_role(
      'نقص جديد في المخزون',
      'تم تسجيل نقص جديد في صنف: ' || NEW.name || ' بواسطة ' || shortage_user_name || ' في ' || to_char(NEW.last_updated, 'YYYY-MM-DD HH24:MI'),
      'ahmad_rajili',
      NEW.updated_by_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic notifications
DROP TRIGGER IF EXISTS notify_admin_on_shortage_trigger ON public.medicines;
CREATE TRIGGER notify_admin_on_shortage_trigger
  AFTER INSERT ON public.medicines
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_shortage();