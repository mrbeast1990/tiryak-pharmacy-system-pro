-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_deducted BOOLEAN NOT NULL DEFAULT false,
  deducted_at TIMESTAMP WITH TIME ZONE,
  deducted_by_id UUID,
  deducted_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_id UUID NOT NULL,
  created_by_name TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all expenses" 
ON public.expenses 
FOR SELECT 
USING (get_my_role() IN ('admin', 'ahmad_rajili'));

CREATE POLICY "Admins can insert expenses" 
ON public.expenses 
FOR INSERT 
WITH CHECK (get_my_role() IN ('admin', 'ahmad_rajili'));

CREATE POLICY "Admins can update expenses" 
ON public.expenses 
FOR UPDATE 
USING (get_my_role() IN ('admin', 'ahmad_rajili'));

CREATE POLICY "Admin can delete expenses" 
ON public.expenses 
FOR DELETE 
USING (get_my_role() = 'admin');