ALTER TABLE public.site_holiday_mascots
  ADD COLUMN IF NOT EXISTS calendar_end_month smallint,
  ADD COLUMN IF NOT EXISTS calendar_end_day smallint,
  ADD COLUMN IF NOT EXISTS holiday_name text;

COMMENT ON COLUMN public.site_holiday_mascots.calendar_end_month IS 'Last day of multi-day calendar span (Hanukkah). NULL = single day.';
COMMENT ON COLUMN public.site_holiday_mascots.calendar_end_day IS 'Last day of multi-day calendar span.';
COMMENT ON COLUMN public.site_holiday_mascots.holiday_name IS 'Display label on the calendar.';
