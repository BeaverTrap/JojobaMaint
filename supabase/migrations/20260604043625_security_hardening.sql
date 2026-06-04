-- =============================================================================
-- Security hardening (from Supabase advisors)
-- =============================================================================

-- 1. is_authorized() doesn't need elevated rights: profiles are publicly
--    readable, so SECURITY INVOKER works everywhere it's used (RLS policies,
--    storage policies) and removes the "anon can exec SECURITY DEFINER" warning.
alter function public.is_authorized() security invoker;

-- 2. Trigger functions should never be callable as RPCs. Triggers still fire
--    (they run as the table owner), but the REST endpoints are removed.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- 3. Public buckets serve files via their public URL regardless of RLS, so the
--    broad SELECT policy on storage.objects is unnecessary and would let clients
--    LIST every file in the bucket. Drop it; image URLs keep working.
drop policy if exists "Public read access for images" on storage.objects;

-- Note: public.authorized_emails intentionally has RLS enabled with NO policies
-- so it is unreadable via the API. Only SECURITY DEFINER functions touch it.
