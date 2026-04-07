ALTER TABLE public.revenues ADD COLUMN IF NOT EXISTS adjustment numeric DEFAULT 0;
ALTER TABLE public.revenues ADD COLUMN IF NOT EXISTS adjustment_note text DEFAULT NULL;