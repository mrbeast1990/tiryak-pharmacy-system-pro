
CREATE OR REPLACE FUNCTION public.send_notification_to_role(
  p_title TEXT,
  p_message TEXT,
  p_recipient_role TEXT,
  p_sender_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
-- SECURITY DEFINER is important to bypass RLS when inserting into notification_read_status for other users.
-- The function will execute with the permissions of the user that created it (the postgres user).
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Step 1: Insert the new notification into the `notifications` table.
  -- The RLS policy on `notifications` allows users with 'admin' or 'ahmad_rajili' role to insert,
  -- but the edge function already checks this. We are running this with SECURITY DEFINER
  -- which belongs to postgres role, so it will bypass RLS.
  INSERT INTO public.notifications (title, message, recipient, sender_id)
  VALUES (p_title, p_message, p_recipient_role, p_sender_id)
  RETURNING id INTO v_notification_id;

  -- Step 2: Insert entries into `notification_read_status` for all relevant users.
  -- This is where SECURITY DEFINER is crucial, as it needs to create rows for other users.
  IF p_recipient_role = 'all' THEN
    -- If the recipient is 'all', insert a read status for every user in the profiles table.
    INSERT INTO public.notification_read_status (notification_id, user_id)
    SELECT v_notification_id, id FROM public.profiles;
  ELSE
    -- If a specific role is targeted, insert for users matching that role.
    -- We need to cast p_recipient_role from TEXT to the app_role enum type.
    INSERT INTO public.notification_read_status (notification_id, user_id)
    SELECT v_notification_id, id FROM public.profiles WHERE role = p_recipient_role::app_role;
  END IF;

  -- Step 3: Return the ID of the newly created notification.
  RETURN v_notification_id;
END;
$$;
