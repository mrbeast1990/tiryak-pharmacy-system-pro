-- تعديل وظيفة إشعار النقص لإنشاء إشعارات مخصصة للمديرين والمستخدمين العاديين
CREATE OR REPLACE FUNCTION public.notify_admin_on_shortage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  shortage_user_name TEXT;
  admin_message TEXT;
  user_message TEXT;
BEGIN
  -- Only proceed if this is a shortage status medicine
  IF NEW.status = 'shortage' THEN
    -- Get the user name who added the shortage
    shortage_user_name := COALESCE(NEW.updated_by_name, 'مستخدم غير معروف');
    
    -- Create different messages for admins and regular users
    admin_message := 'تم تسجيل نقص جديد في صنف: ' || NEW.name || ' بواسطة ' || shortage_user_name || ' في ' || to_char(NEW.last_updated, 'YYYY-MM-DD HH24:MI');
    user_message := 'تم تسجيل نقص جديد في صنف: ' || NEW.name;
    
    -- Send notification to admins with detailed message
    PERFORM public.send_notification_to_role(
      'نقص جديد في المخزون',
      admin_message,
      'admin',
      NEW.updated_by_id
    );
    
    -- Also send to ahmad_rajili with detailed message
    PERFORM public.send_notification_to_role(
      'نقص جديد في المخزون',
      admin_message,
      'ahmad_rajili',
      NEW.updated_by_id
    );
    
    -- Send notification to other shift users with basic message (excluding the sender)
    PERFORM public.send_notification_to_role(
      'نقص جديد في المخزون',
      user_message,
      'morning_shift',
      NEW.updated_by_id
    );
    
    PERFORM public.send_notification_to_role(
      'نقص جديد في المخزون',
      user_message,
      'evening_shift',
      NEW.updated_by_id
    );
    
    PERFORM public.send_notification_to_role(
      'نقص جديد في المخزون',
      user_message,
      'night_shift',
      NEW.updated_by_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;