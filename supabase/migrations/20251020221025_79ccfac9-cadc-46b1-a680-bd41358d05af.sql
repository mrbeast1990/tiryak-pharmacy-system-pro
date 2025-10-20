-- Add fcm_token column to profiles table for storing Firebase Cloud Messaging tokens
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token ON profiles(fcm_token) WHERE fcm_token IS NOT NULL;