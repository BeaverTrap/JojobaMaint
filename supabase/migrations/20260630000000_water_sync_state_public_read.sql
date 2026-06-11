-- Allow residents to see when water usage data was last refreshed.

create policy "Water sync state is publicly viewable"
  on public.water_usage_sync_state for select
  to anon, authenticated
  using (true);
