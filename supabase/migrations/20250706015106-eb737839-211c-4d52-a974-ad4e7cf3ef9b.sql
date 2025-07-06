-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    name TEXT,
    role app_role NOT NULL
);

-- Create medicines table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.medicines (
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

-- Create revenues table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.revenues (
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

-- Create account requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.account_requests (
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

-- Create notifications system tables if they don't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    recipient TEXT NOT NULL,
    sender_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notification_read_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_read_status ENABLE ROW LEVEL SECURITY;