-- Thanksgiving week tint on calendar (Turkey only; Pilgrim is rotation-only).
UPDATE public.site_holiday_mascots
SET
  holiday_name = 'Thanksgiving',
  calendar_end_month = NULL,
  calendar_end_day = NULL
WHERE label ILIKE 'Turkey quail';

UPDATE public.site_holiday_mascots
SET
  calendar_month = NULL,
  calendar_day = NULL,
  calendar_end_month = NULL,
  calendar_end_day = NULL,
  holiday_name = NULL
WHERE label ILIKE 'Pilgrim quail';

-- Christmas Eve + Day span for December mascots.
UPDATE public.site_holiday_mascots
SET
  calendar_month = 12,
  calendar_day = 24,
  calendar_end_month = 12,
  calendar_end_day = 25,
  holiday_name = 'Christmas'
WHERE label ILIKE 'Santa quail' OR label ILIKE 'Elf quail';

-- Hanukkah spans (2026–2031): first candle through last night.
UPDATE public.site_holiday_mascots SET calendar_month = 12, calendar_day = 4,  calendar_end_month = 12, calendar_end_day = 12, holiday_name = 'Hanukkah' WHERE label ILIKE 'Hanukkah quail' AND year = 2026;
UPDATE public.site_holiday_mascots SET calendar_month = 12, calendar_day = 24, calendar_end_month = 1,  calendar_end_day = 1,  holiday_name = 'Hanukkah' WHERE label ILIKE 'Hanukkah quail' AND year = 2027;
UPDATE public.site_holiday_mascots SET calendar_month = 12, calendar_day = 12, calendar_end_month = 12, calendar_end_day = 20, holiday_name = 'Hanukkah' WHERE label ILIKE 'Hanukkah quail' AND year = 2028;
UPDATE public.site_holiday_mascots SET calendar_month = 12, calendar_day = 1,  calendar_end_month = 12, calendar_end_day = 9,  holiday_name = 'Hanukkah' WHERE label ILIKE 'Hanukkah quail' AND year = 2029;
UPDATE public.site_holiday_mascots SET calendar_month = 12, calendar_day = 20, calendar_end_month = 12, calendar_end_day = 28, holiday_name = 'Hanukkah' WHERE label ILIKE 'Hanukkah quail' AND year = 2030;
UPDATE public.site_holiday_mascots SET calendar_month = 12, calendar_day = 9,  calendar_end_month = 12, calendar_end_day = 17, holiday_name = 'Hanukkah' WHERE label ILIKE 'Hanukkah quail' AND year = 2031;
