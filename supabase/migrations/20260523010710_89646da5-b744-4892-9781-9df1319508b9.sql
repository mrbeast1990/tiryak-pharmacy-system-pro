DELETE FROM public.accountant_verifications a
USING public.accountant_verifications b
WHERE a.ctid < b.ctid
  AND a.date = b.date
  AND a.period = b.period
  AND a.target_user_id = b.target_user_id;

CREATE UNIQUE INDEX IF NOT EXISTS accountant_verifications_date_period_user_uniq
  ON public.accountant_verifications (date, period, target_user_id);