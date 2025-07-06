-- Create helper function to get user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Create notification function
CREATE OR REPLACE FUNCTION public.send_notification_to_role(p_title text, p_message text, p_recipient_role text, p_sender_id uuid)
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
    SELECT v_notification_id, id FROM public.profiles WHERE role = p_recipient_role::app_role;
  END IF;

  RETURN v_notification_id;
END;
$$;

-- Create trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
  user_name TEXT;
BEGIN
  CASE NEW.email
    WHEN 'deltanorthpharm@gmail.com' THEN
      user_role := 'admin';
      user_name := 'المدير';
    WHEN 'ahmad@tiryak.com' THEN
      user_role := 'ahmad_rajili';
      user_name := 'أحمد الرجيلي';
    WHEN 'morning@tiryak.com' THEN
      user_role := 'morning_shift';
      user_name := 'الفترة الصباحية';
    WHEN 'evening@tiryak.com' THEN
      user_role := 'evening_shift';
      user_name := 'الفترة المسائية';
    WHEN 'night@tiryak.com' THEN
      user_role := 'night_shift';
      user_name := 'الفترة الليلية';
    ELSE
      user_role := 'member';
      user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  END CASE;

  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, user_name, user_role);

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();