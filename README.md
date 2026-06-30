# JojobaWorks

The maintenance dashboard and resident portal for **Jojoba Hills SKP Resort**. It's a park operations hub — live status for water, power, laundry/restrooms, and park alerts; an interactive park map with valve/lot/site lookup; weather and sky; a knowledge base and work log; and a maintenance schedule — with a staff-only admin behind Google sign-in.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth + Postgres + Storage) · Vercel.

> **Looking for the full reference?** The [Site Bible](docs/site-bible.md) documents every route, the data model, integrations, staff roles, and a staff how-to guide. This README covers setup and deploy.

---

## What's inside

- **Home dashboard** — park alerts, water & power status, laundry & restrooms (per-unit), weather bar.
- **Feed & knowledge base** — posts, articles, tree & maintenance assessments, real-time search.
- **Park map** — interactive map, valve/zone lookup, lot and site profiles.
- **Water** — usage dashboard, monthly report, shutoff calendar (Google Sheets sync).
- **Weather & sky** — themed forecast, sky/space, moon phase, earthquakes, NWS alerts.
- **Schedule** — maintenance calendar synced from Google Calendar.
- **Staff admin** — `/admin` hub gated by Google sign-in and staff roles (staff < manager < admin).

See [docs/site-bible.md](docs/site-bible.md) for the complete feature and architecture reference.

---

## 1. Install

```bash
npm install
```

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project** (Free Tier is fine).
2. In **Project Settings → API**, copy the **Project URL** and **anon/publishable key**.

## 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Minimum to boot:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`.env.example` documents every optional integration (Google Calendar/Sheets, Maps, NASA, NWS, MaintainX, cron). Full list: [Site Bible → Environment variables](docs/site-bible.md#environment-variables).

## 4. Run the database migrations

Migrations live in `supabase/migrations/` and **run in filename order**. For a fresh project, apply them all.

### Option A — Supabase CLI (recommended)

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option B — SQL Editor (no CLI)

Open **SQL Editor → New query** and paste each migration in order (oldest first).

A per-migration summary is in the [Site Bible → Data model](docs/site-bible.md#data-model-migrations).

## 5. Enable Google authentication

1. **Supabase → Authentication → Providers → Google → Enable.**
2. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Web application). Set the **Authorized redirect URI** to the callback URL shown on the Supabase Google provider screen.
3. Paste Google's **Client ID/Secret** into Supabase.
4. **Supabase → Authentication → URL Configuration:** set **Site URL** and add `…/auth/callback` redirect URLs for local and production.

## 6. Authorize staff (the whitelist)

Access is public to read, but only **whitelisted** emails can post — controlled server-side. Add an email with a role:

```sql
insert into public.authorized_emails (email, staff_role, note) values
  ('jane@gmail.com', 'manager', 'Lead maintenance'),
  ('crew@gmail.com', 'staff',   'Grounds crew')
on conflict (email) do update set staff_role = excluded.staff_role;
```

Roles take effect on next sign-in. Details and the role matrix: [Site Bible → How access works](docs/site-bible.md#how-access-works-auth--roles).

## 7. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

---

## Deploy to Vercel

1. Push to GitHub and import into [Vercel](https://vercel.com).
2. Add your env vars under **Project → Settings → Environment Variables** (set `NEXT_PUBLIC_SITE_URL` to the production URL; add server-only Google/cron vars for Production and Preview).
3. Add the production callback URL to Google Cloud and Supabase (step 5).
4. Deploy. Cron jobs (`vercel.json`) handle the daily calendar sync and weekly sheet sync.

---

## Branding

Logo and quail-mascot assets live in `public/assets/`. Brand colors are `--color-brand-*` tokens in `src/app/globals.css`.

---

## Security notes

- **RLS:** every content table allows public SELECT; writes are restricted by `public.has_staff_role(...)`. The `images` Storage bucket is public-read, authorized-write.
- **Tamper-proof whitelist:** `is_authorized` and `staff_role` are not client-writable — set only by `SECURITY DEFINER` functions on signup/login. `authorized_emails` has RLS with no policies (unreadable via API).
- **Defense in depth:** `/admin` is gated in `src/proxy.ts` (signed in) and again in `src/app/admin/layout.tsx` (authorized).
- Never commit `.env.local`; keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

---

## Documentation

- [Site Bible](docs/site-bible.md) — full reference (routes, data model, integrations, roles, staff how-to).
- [Work request portal](docs/work-request-portal.md) — MaintainX setup.
- [Emergency text alerts](docs/emergency-text-alerts.md) — proposed auto-ingest (not built yet).
