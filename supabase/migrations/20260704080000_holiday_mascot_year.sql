ALTER TABLE public.site_holiday_mascots ADD COLUMN IF NOT EXISTS year smallint;
COMMENT ON COLUMN public.site_holiday_mascots.year IS 'If set, this entry only applies to this specific year. NULL means every year (fixed holidays).';
