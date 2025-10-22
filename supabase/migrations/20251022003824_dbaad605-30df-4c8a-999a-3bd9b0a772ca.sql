-- Create or replace function to send push notifications for medicine updates
CREATE OR REPLACE FUNCTION public.send_medicine_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_notification_type TEXT;
  v_recipient TEXT;
BEGIN
  -- Only proceed for shortage or available status
  IF NEW.status IN ('shortage', 'available') THEN
    
    -- Determine notification details based on status
    IF NEW.status = 'shortage' THEN
      v_title := 'نقص جديد في المخزون';
      v_body := '🟠 تمت إضافة صنف جديد إلى النواقص: ' || NEW.name;
      v_notification_type := 'shortage';
      v_recipient := 'all';
    ELSIF NEW.status = 'available' AND OLD.status = 'shortage' THEN
      v_title := 'توفر صنف في المخزون';
      v_body := '🟢 تم توفير صنف جديد في المخزون: ' || NEW.name;
      v_notification_type := 'system';
      v_recipient := 'all';
    ELSE
      -- Don't send notification for other status changes
      RETURN NEW;
    END IF;

    -- Call send-push-notification via HTTP request
    -- Note: This uses pg_net extension which must be enabled
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'title', v_title,
          'body', v_body,
          'recipient', v_recipient,
          'notificationType', v_notification_type
        )
      );
      
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the medicine update
    RAISE WARNING 'Failed to send push notification: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS medicine_push_notification_trigger ON public.medicines;

-- Create trigger for medicine push notifications
CREATE TRIGGER medicine_push_notification_trigger
AFTER INSERT OR UPDATE OF status ON public.medicines
FOR EACH ROW
EXECUTE FUNCTION public.send_medicine_push_notification();