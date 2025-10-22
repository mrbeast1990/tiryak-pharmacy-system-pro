-- Add notifications_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.notifications_enabled IS 'Controls whether the user receives push notifications';

-- Update RLS policy to allow users to update their own notification preferences
CREATE POLICY "Users can update their own notification preferences" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);