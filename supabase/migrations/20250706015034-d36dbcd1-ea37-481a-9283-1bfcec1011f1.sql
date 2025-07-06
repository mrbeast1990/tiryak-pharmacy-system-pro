-- Create user roles enum
CREATE TYPE public.app_role AS ENUM (
    'admin',
    'ahmad_rajili', 
    'morning_shift',
    'evening_shift',
    'night_shift',
    'member'
);

-- Create profiles table for user management
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    name TEXT,
    role public.app_role NOT NULL
);

-- Create medicines table for inventory management
CREATE TABLE public.medicines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    repeat_count INTEGER DEFAULT 1,
    updated_by_id UUID,
    updated_by_name TEXT
);

-- Create revenues table for financial tracking
CREATE TABLE public.revenues (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    period TEXT NOT NULL,
    type TEXT NOT NULL,
    notes TEXT,
    created_by_id UUID NOT NULL,
    created_by_name TEXT NOT NULL
);

-- Create account requests table for signup management
CREATE TABLE public.account_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by_id UUID,
    reviewed_by_name TEXT
);

-- Create notifications system tables
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    recipient TEXT NOT NULL,
    sender_id UUID NOT NULL
);

CREATE TABLE public.notification_read_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_read_status ENABLE ROW LEVEL SECURITY;

-- Create helper function to get user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
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
  user_role public.app_role;
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

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Create RLS policies for medicines
CREATE POLICY "Authenticated users can view medicines" ON public.medicines
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert medicines" ON public.medicines
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update medicines" ON public.medicines
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete medicines" ON public.medicines
FOR DELETE USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Create RLS policies for revenues
CREATE POLICY "Admins can view all revenues" ON public.revenues
FOR SELECT USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Shift users can view their own revenues" ON public.revenues
FOR SELECT USING (
  (get_my_role() = 'morning_shift'::app_role AND period = 'morning') OR
  (get_my_role() = 'evening_shift'::app_role AND period = 'evening') OR
  (get_my_role() = 'night_shift'::app_role AND period = 'night')
);

CREATE POLICY "Users can insert revenues" ON public.revenues
FOR INSERT WITH CHECK (
  created_by_id = auth.uid() AND
  (
    (get_my_role() = 'morning_shift'::app_role AND period = 'morning') OR
    (get_my_role() = 'evening_shift'::app_role AND period = 'evening') OR
    (get_my_role() = 'night_shift'::app_role AND period = 'night') OR
    get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role])
  )
);

CREATE POLICY "Admins can update revenues" ON public.revenues
FOR UPDATE USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can delete revenues" ON public.revenues
FOR DELETE USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Create RLS policies for account requests
CREATE POLICY "Allow public access to create account requests" ON public.account_requests
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all account requests" ON public.account_requests
FOR SELECT USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can update account requests" ON public.account_requests
FOR UPDATE USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

CREATE POLICY "Admins can delete account requests" ON public.account_requests
FOR DELETE USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Create RLS policies for notifications
CREATE POLICY "Admins can create notifications" ON public.notifications
FOR INSERT WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role])
);

CREATE POLICY "Users can read notifications intended for them" ON public.notifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM notification_read_status 
    WHERE notification_id = notifications.id AND user_id = auth.uid()
  )
);

-- Create RLS policies for notification read status
CREATE POLICY "Users can read their own notification statuses" ON public.notification_read_status
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification statuses" ON public.notification_read_status
FOR UPDATE USING (user_id = auth.uid());