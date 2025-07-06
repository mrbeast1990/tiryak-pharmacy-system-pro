-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view medicines" ON public.medicines;
DROP POLICY IF EXISTS "Authenticated users can insert medicines" ON public.medicines;
DROP POLICY IF EXISTS "Authenticated users can update medicines" ON public.medicines;
DROP POLICY IF EXISTS "Admins can delete medicines" ON public.medicines;
DROP POLICY IF EXISTS "Admins can view all revenues" ON public.revenues;
DROP POLICY IF EXISTS "Shift users can view their own revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can insert revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admins can update revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admins can delete revenues" ON public.revenues;
DROP POLICY IF EXISTS "Allow public access to create account requests" ON public.account_requests;
DROP POLICY IF EXISTS "Admins can view all account requests" ON public.account_requests;
DROP POLICY IF EXISTS "Admins can update account requests" ON public.account_requests;
DROP POLICY IF EXISTS "Admins can delete account requests" ON public.account_requests;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can read notifications intended for them" ON public.notifications;
DROP POLICY IF EXISTS "Users can read their own notification statuses" ON public.notification_read_status;
DROP POLICY IF EXISTS "Users can update their own notification statuses" ON public.notification_read_status;

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