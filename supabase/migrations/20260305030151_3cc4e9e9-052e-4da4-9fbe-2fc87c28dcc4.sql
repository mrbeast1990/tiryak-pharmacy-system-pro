
ALTER TABLE public.revenues DROP CONSTRAINT revenues_type_check;
ALTER TABLE public.revenues ADD CONSTRAINT revenues_type_check CHECK (type = ANY (ARRAY['income'::text, 'expense'::text, 'banking_services'::text]));

ALTER TABLE public.revenues DROP CONSTRAINT revenues_period_check;
ALTER TABLE public.revenues ADD CONSTRAINT revenues_period_check CHECK (period = ANY (ARRAY['morning'::text, 'evening'::text, 'night'::text, 'ahmad_rajili'::text, 'abdulwahab'::text]));
