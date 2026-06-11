# Jojoba Hills Maintenance

A modern, responsive web app for the Jojoba Hills SKP Resort maintenance department. It works as a **digital logbook**, an **internal social feed**, and a **project photo gallery** — all gated behind Google sign-in.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth + Postgres + Storage) · Vercel.

---

## Features

- **Public portfolio** — anyone can browse the feed (`/`) and galleries (`/galleries`) without logging in.
- **Staff-only posting** — a protected `/admin` dashboard holds the upload forms. Access is limited to whitelisted employees; unauthorized visitors are redirected home.
- **Google login** via Supabase Auth, with a server-controlled email whitelist (`is_authorized`).
- **Feed** — social-media-style cards with photo, description, author, and timestamp.
- **Real-time search** — instantly filters post descriptions so the feed doubles as a knowledge base.
- **Quick uploader** — short description + one photo (camera roll or PC) straight to the feed.
- **Gallery Manager** — named project albums with a **masonry grid** and **multi-image drag-and-drop** upload.
- **Client-side image compression** — every image is squeezed to **~300 KB** (WebP) before upload to stay within the Supabase Free Tier's 1 GB.
- **Branding placeholders** — drop `logo.png` / `mascot.png` into `public/assets/` and they appear automatically.

---

## 1. Install

```bash
npm install
```

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project** (Free Tier is fine).
2. In **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 4. Run the database migration

The schema is split across three migration files (run them **in order**):

```
supabase/migrations/20260604043453_initial_schema.sql               # tables, triggers, Storage bucket
supabase/migrations/20260604043520_public_access_and_whitelist.sql  # public-read + staff whitelist RLS
supabase/migrations/20260604043625_security_hardening.sql           # advisor fixes
```

> Already applied to the `kpjxyrxrdrqpodsqwwui` project. These steps are only needed for a fresh project. Pick **one** method:

### Option A — Supabase CLI (recommended)

```bash
# Install once (see https://supabase.com/docs/guides/cli):
#   npm i -g supabase   (or:  brew install supabase/tap/supabase)

supabase login
supabase link --project-ref <your-project-ref>   # from your dashboard URL
supabase db push                                  # applies everything in supabase/migrations/
```

> `supabase init` is **not** required — the `supabase/` folder and migration file already exist. If the CLI asks, just keep the existing files.

### Option B — SQL Editor (no CLI)

1. Open your project → **SQL Editor → New query**.
2. Paste the contents of each migration file (oldest version first), running each in turn.

After running, confirm in the dashboard:
- **Table Editor:** `profiles`, `posts`, `galleries`, `gallery_images`
- **Storage:** a public bucket named `images`

## 5. Enable Google authentication

1. **Supabase → Authentication → Providers → Google → Enable.**
2. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (OAuth client → Web application).
   - **Authorized redirect URI:** copy the callback URL shown on the Supabase Google provider screen
     (looks like `https://<project-ref>.supabase.co/auth/v1/callback`).
3. Paste Google's **Client ID** and **Client Secret** back into Supabase and save.
4. **Supabase → Authentication → URL Configuration:**
   - **Site URL:** `http://localhost:3000` (and your Vercel URL in production).
   - **Redirect URLs:** add `http://localhost:3000/auth/callback` and `https://your-app.vercel.app/auth/callback`.

## 6. Authorize maintenance staff (the whitelist)

The app is public to read, but only **whitelisted** employees can post. Authorization
is controlled entirely server-side — users can never grant it to themselves.

**To authorize someone**, add their Google email to the `authorized_emails` table
(SQL Editor or Table Editor):

```sql
insert into public.authorized_emails (email, note) values
  ('jane.doe@gmail.com', 'Lead maintenance'),
  ('john.smith@gmail.com', 'Grounds crew')
on conflict (email) do nothing;
```

How it becomes active:
- On **each login**, the app calls a secure `sync_my_authorization()` function that flips
  the user's `profiles.is_authorized` flag based on this list. So you can whitelist
  someone before *or* after their first login — they just sign out and back in to refresh.
- Authorized users then see **"New post"**, **"Manage galleries"**, and the **Dashboard** link,
  and can reach `/admin`. Everyone else is redirected to the public feed.

To revoke access, delete the email row and update the flag:

```sql
delete from public.authorized_emails where email = 'jane.doe@gmail.com';
update public.profiles set is_authorized = false
  where id = (select id from auth.users where email = 'jane.doe@gmail.com');
```

## 7. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, and start posting.

## 8. Work request portal (MaintainX)

The public **Submit Request** page (`/request`) embeds an external MaintainX portal when configured.

```env
NEXT_PUBLIC_MAINTAINX_URL=https://app.getmaintainx.com/work-request/your-portal-id
```

Add that to `.env.local` (and Vercel env vars in production), restart the dev server, and redeploy. Without it, `/request` shows an offline placeholder.

**Full setup, troubleshooting, and file map:** [docs/work-request-portal.md](docs/work-request-portal.md)

---

## Custom branding

Add your files to `public/assets/` (no code changes needed):

| File | Appears in |
| --- | --- |
| `public/assets/logo.png` | Navbar (top-left) + login screen |
| `public/assets/mascot.png` | Login screen (above the sign-in button) |

Until they exist, clean text/emoji placeholders are shown. Brand colors live as
`--color-brand-*` tokens in `src/app/globals.css` — tweak them to match the park.

---

## Deploy to Vercel

1. Push this repo to GitHub and import it into [Vercel](https://vercel.com).
2. Add the three env vars from `.env.local` to **Vercel → Project → Settings → Environment Variables**
   (set `NEXT_PUBLIC_SITE_URL` to your production URL, e.g. `https://your-app.vercel.app`).
3. Add the production callback URL to both Google Cloud and Supabase (see step 5).
4. Deploy.

---

## Project structure

```
src/
  app/
    (public)/               # PUBLIC area (no auth) — shares the Navbar layout
      layout.tsx
      page.tsx              # "/"            feed (read-only for visitors)
      galleries/page.tsx    # "/galleries"   album list
      galleries/[id]/page.tsx  # gallery view (masonry, read-only)
    admin/                  # PROTECTED area — guarded by layout (auth + is_authorized)
      layout.tsx            # redirects unauthorized users to "/"
      page.tsx              # post uploader
      galleries/page.tsx    # create + manage galleries
      galleries/[id]/page.tsx  # multi-image uploader + photos
    auth/
      callback/route.ts     # OAuth exchange + whitelist sync
      signout/route.ts
    login/page.tsx          # staff sign-in
    layout.tsx
  components/               # Navbar, Feed, PostCard, SearchBar, uploaders, Brand
  lib/
    supabase/               # browser, server, and proxy/session clients
    auth.ts                 # getCurrentUser() -> { profile, isAuthorized }
    compress.ts             # browser-image-compression helper (< 300 KB)
    upload.ts               # compress + upload to Storage
    database.types.ts
  proxy.ts                  # session refresh + /admin login gate (Next 16 "proxy")
supabase/
  migrations/               # schema, RLS, whitelist, triggers, Storage bucket
public/assets/              # drop logo.png + mascot.png here
```

---

## Security notes

- **RLS access model:** every content table allows **public SELECT** (anon + authenticated) but restricts **INSERT/UPDATE/DELETE** to authenticated users where `public.is_authorized()` is true. The same rule applies to the `images` Storage bucket (public read, authorized-only write/delete).
- **Whitelist is tamper-proof:** `is_authorized` is **not** client-writable. A column-level `GRANT` blocks clients from updating it, and it is only ever set by the `SECURITY DEFINER` functions `handle_new_user` (signup) and `sync_my_authorization` (login). The `authorized_emails` table has RLS enabled with no policies, so it is unreadable via the API.
- **Auth checks:** `/admin` is gated in middleware (must be signed in) and again in the layout (must be authorized) — defense in depth.
- Never commit `.env.local`. Only `NEXT_PUBLIC_*` values reach the browser — keep the `service_role` key out of this app entirely.
