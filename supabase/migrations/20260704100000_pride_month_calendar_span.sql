-- Pride Month: full June calendar span (not a single parade day).
UPDATE public.site_holiday_mascots
SET
  calendar_month = 6,
  calendar_day = 1,
  calendar_end_month = 6,
  calendar_end_day = 30,
  holiday_name = 'Pride Month',
  start_month = 6,
  start_day = 1,
  end_month = 6,
  end_day = 30
WHERE label ILIKE 'Pride quail';
