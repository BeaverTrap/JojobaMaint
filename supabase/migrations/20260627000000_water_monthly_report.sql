-- Monthly report breakdown from Usage Calculations sheet rows.

alter table public.water_usage_readings
  add column if not exists oak_grove_gallons numeric,
  add column if not exists two_tank_gallons numeric,
  add column if not exists rigs_facilities_gallons numeric,
  add column if not exists ponds_gallons numeric,
  add column if not exists irrigation_leaks_gallons numeric;

comment on column public.water_usage_readings.gallons is
  'Total gallons pumped for the month (Monthly Report total).';
comment on column public.water_usage_readings.oak_grove_gallons is
  'Oak Grove pumped gallons for the month.';
comment on column public.water_usage_readings.two_tank_gallons is
  'Two Tank pumped gallons for the month.';
comment on column public.water_usage_readings.rigs_facilities_gallons is
  'Rigs and facilities usage gallons for the month.';
comment on column public.water_usage_readings.ponds_gallons is
  'Pond fill gallons for the month.';
comment on column public.water_usage_readings.irrigation_leaks_gallons is
  'Irrigation, leaks, and unmetered usage gallons for the month.';
