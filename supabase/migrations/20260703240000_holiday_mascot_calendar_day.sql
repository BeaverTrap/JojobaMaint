ALTER TABLE public.site_holiday_mascots
  ADD COLUMN IF NOT EXISTS calendar_month smallint,
  ADD COLUMN IF NOT EXISTS calendar_day smallint;

COMMENT ON COLUMN public.site_holiday_mascots.calendar_month IS 'The specific month to display on the calendar (range is only for navbar rotation).';
COMMENT ON COLUMN public.site_holiday_mascots.calendar_day IS 'The specific day to display on the calendar.';
