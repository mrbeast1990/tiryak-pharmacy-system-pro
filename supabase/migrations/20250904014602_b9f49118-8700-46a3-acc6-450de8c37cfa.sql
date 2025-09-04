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