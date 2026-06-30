# JojobaWorks — Site Bible

The single reference for **JojobaWorks**, the maintenance dashboard and resident-facing portal for **Jojoba Hills SKP Resort**. It explains what the app does, how it's built, every route, the data model, integrations, and how staff use it day to day.

- **New here?** Read [Quick orientation](#quick-orientation), then jump to your area.
- **Setting up the project?** See the [README](../README.md) for install/run/deploy, then [Environment variables](#environment-variables).
- **Park staff/admin?** Skip to [Staff how-to guide](#staff-how-to-guide).

---

## Table of contents

1. [Quick orientation](#quick-orientation)
2. [Tech stack](#tech-stack)
3. [How access works (auth + roles)](#how-access-works-auth--roles)
4. [Route map](#route-map)
5. [Feature systems](#feature-systems)
6. [Data model (migrations)](#data-model-migrations)
7. [API routes](#api-routes)
8. [External integrations](#external-integrations)
9. [Environment variables](#environment-variables)
10. [Scheduled jobs (cron)](#scheduled-jobs-cron)
11. [Project structure](#project-structure)
12. [Staff how-to guide](#staff-how-to-guide)
13. [Conventions for developers](#conventions-for-developers)
14. [Other docs](#other-docs)

---

## Quick orientation

JojobaWorks is a **Next.js 16 App Router** app backed by **Supabase** (Auth + Postgres + Storage) and deployed on **Vercel**. It serves two audiences from one codebase:

- **Residents & the public** — browse the home dashboard (park status, weather, water, alerts), the feed, articles, the interactive park map, valve/lot lookup, and the laundry/restroom status board. No login required.
- **Maintenance staff** — sign in with Google to reach `/admin`, where they post updates, manage articles and assessments, set park alerts, and update utility/facility status.

The app started as a photo feed + galleries logbook and has grown into a full park operations hub. The two route groups in `src/app/` reflect this split:

- `src/app/(public)/` — everything anyone can see (shares the navbar layout).
- `src/app/admin/` — staff-only, guarded by auth **and** staff role.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`, `@tailwindcss/forms`) |
| Backend | Supabase — Postgres, Auth (Google OAuth), Storage |
| Hosting | Vercel (cron jobs via `vercel.json`) |
| Maps | `@vis.gl/react-google-maps` (optional) + built-in PNG schematic fallback |
| Charts | `recharts` (water usage dashboard) |
| Astronomy | `astronomy-engine`, `moon-phase` helpers (sky/space section) |
| Content | `marked`, `react-markdown`, `remark-gfm`, `rehype-raw`, `turndown` |
| PDF/export | `jspdf`, `html2canvas` (printable reports) |
| Images | `browser-image-compression` (client-side ~300 KB WebP), `react-dropzone` |
| Google APIs | `googleapis` (Calendar + Sheets sync, server-only) |

Scripts (`package.json`): `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

---

## How access works (auth + roles)

Authentication is **Google OAuth via Supabase**. Authorization is **server-controlled** — users can never grant themselves access.

### The whitelist

- The `authorized_emails` table holds approved Google emails plus a `staff_role`.
- On signup (`handle_new_user`) and on every login (`sync_my_authorization`), the app copies the matching `staff_role` onto the user's `profiles` row and flips `is_authorized`.
- `authorized_emails` has RLS enabled with **no policies** — it's unreadable through the API. `is_authorized` and `staff_role` are **not** in the client UPDATE grant, so they can't be tampered with.

### Staff role tiers

Defined in `src/lib/staff-roles.ts` and enforced in Postgres via `has_staff_role()`:

| Role | Rank | Can do |
| --- | --- | --- |
| `staff` | 1 | Create landscaping/maintenance posts |
| `manager` | 2 | Everything staff can, plus articles, assessments, park alerts, facility/utility status, pickup guidelines, map editing, water sync |
| `admin` | 3 | Everything, plus admin-only tools (e.g. weather mascot layout tuner) |

Helpers: `hasMinimumStaffRole(role, minimum)`, `canManageSiteContent` (manager+), `isAdminRole`. Server pages use `getCurrentUser()` (`src/lib/auth.ts`) which returns `{ userId, profile, isAuthorized, staffRole }`.

### Defense in depth

- `src/proxy.ts` (Next 16 "proxy" / middleware) refreshes the session and gates `/admin` (must be signed in).
- `src/app/admin/layout.tsx` re-checks authorization and redirects unauthorized users home.
- Every content table has RLS: **public SELECT**, writes restricted by `has_staff_role(...)`.

To authorize someone, add their email to `authorized_emails` with a role:

```sql
insert into public.authorized_emails (email, staff_role, note) values
  ('jane@gmail.com', 'manager', 'Lead maintenance'),
  ('crew@gmail.com', 'staff',   'Grounds crew')
on conflict (email) do update set staff_role = excluded.staff_role;
```

They pick up the new role the next time they sign in.

---

## Route map

### Public (`src/app/(public)/`)

| Route | Purpose |
| --- | --- |
| `/` | Home dashboard — park alerts, water/power status, laundry & restrooms, weather bar, today widgets |
| `/feed` | Social-style feed of posts (landscaping/maintenance), real-time search |
| `/posts/[id]` | Single post view |
| `/articles`, `/articles/[slug]` | Knowledge-base articles / how-tos |
| `/tree-assessments`, `/tree-assessments/[slug]` | Tree assessment records |
| `/maintenance-assessments`, `/maintenance-assessments/[slug]` | Maintenance assessment records |
| `/water` | Water usage dashboard (charts, monthly report, shutoff calendar) |
| `/weather`, `/weather/stack` | Weather page (themed hero, forecast, sky & space); `stack` is the mascot layout preview |
| `/map`, `/map/edit` | Interactive park map; `edit` is the manager editor |
| `/sites`, `/sites/[slug]` | Park amenity / system place directory + profiles |
| `/valves`, `/valves/[valveId]` | Valve lookup and shutoff profiles |
| `/lots`, `/lots/[slug]` | Lot directory and lot profiles |
| `/schedule` | Maintenance calendar (synced from Google Calendar) |
| `/pickup-guidelines` | Green-waste pickup guidelines and schedule |
| `/request` | Redirects to MaintainX work-request portal (or offline placeholder) |

### Auth

| Route | Purpose |
| --- | --- |
| `/login` | Staff Google sign-in |
| `/auth/callback` | OAuth exchange + whitelist sync |
| `/auth/signout` | Sign out |

### Admin (`src/app/admin/`, manager+ unless noted)

| Route | Purpose |
| --- | --- |
| `/admin` | Hub dashboard + post uploader (`?area=landscaping`/`maintenance`) |
| `/admin/announcements`, `/new`, `/[id]/edit` | **Park alerts** — water/power/general alerts |
| `/admin/facilities-status` | **Laundry & restrooms** — per-unit status (washers, dryers, showers, toilets, urinals, sinks, hot water, kitchen) |
| `/admin/water-status`, `/admin/power-status` | Legacy utility status editors (alerts now drive these) |
| `/admin/laundry-status`, `/admin/bathroom-status` | Legacy routes → redirect to `/admin/facilities-status` |
| `/admin/articles`, `/new`, `/[id]/edit` | Manage articles |
| `/admin/tree-assessments`, `/new`, `/[id]/edit` | Manage tree assessments |
| `/admin/maintenance-assessments`, `/new`, `/[id]/edit` | Manage maintenance assessments |
| `/admin/posts/[id]/edit` | Edit a feed post |
| `/admin/pickup-guidelines` | Green-waste banner text + summer toggle |

The admin hub cards are defined in `src/lib/admin-hub.ts` (grouped into Create / Manage / Public / Tools, each card gated by `minimumRole`).

---

## Feature systems

### Home dashboard (`/`)
Assembled in `src/app/(public)/page.tsx` from status sections:
- **Park alerts** — `AnnouncementBoard` shows all active alerts in one place. See [Park alerts](#park-alerts--announcements).
- **Water & power** — `HomeUtilityStatus` → `WaterStatusCard` / `PowerStatusCard`.
- **Laundry & restrooms** — `HomeFacilitiesStatus` (collapsible) → `FacilityLocationCard`.
- **Weather bar** — `ParkWeatherBar` docks under the navbar.
- **Today widgets** — `HomeTodayWidgets`.

### Park alerts / announcements
- Lib: `src/lib/announcements.ts`, `src/lib/park-alerts.ts`.
- One admin section (`/admin/announcements`) creates any alert; the **alert type** (water/power/general) is metadata.
- `resolveParkAlerts()` returns the board alerts plus `water`/`power` status overrides (tone, art, label, end time). Active alerts re-tone the matching utility card **without** duplicating the alert text.
- Severity: `info` / `notice` / `urgent`. Alert types include `water_shutoff`, `water_planned`, `water_gravity`, `power_outage`, `power_planned`, `general`, `laundry`.

### Water
- **Status** (`src/lib/water-status.ts`) — normal / planned shutoff / active shutoff / gravity feed. `resolveWaterFacilityClosure()` closes **all laundry and restrooms** when water is off (active/planned shutoff, or matching active alerts — not gravity feed).
- **Usage dashboard** (`/water`, `src/components/WaterUsageDashboard.tsx`) — charts via `recharts`, collapsible sections, preferences persisted (`water-chart-preferences.ts`).
- **Monthly report** — synced from Google Sheets ("Usage Calculations" tab) via `/api/sheets/sync`.

### Power
- `src/lib/power-status.ts` (manual status) + `src/lib/power-outages.ts` (nearby SCE outages).
- `/api/power/outages` serves cached outage data (revalidated).

### Facilities (laundry + restrooms)
The most detailed system. Buildings carry laundry/kitchen/hot-water equipment; restrooms are individual rooms.

- **Buildings**: West Laundry, East Laundry, Boondocks, Friendship Hall, Office & Ranch House.
- **Per-unit tracking** — every washer, dryer, pet washer, water heater, kitchen sink, oven, shower, toilet, urinal, and sink has its own `ok` / `out` state (stored as JSON arrays). Restrooms can also be marked **closed** as a whole.
- Libs: `facility-status.ts` (fetch + tone helpers), `facility-unit-status.ts` and `facility-unit-states.ts` (per-unit state logic), `database.types.ts` (types).
- UI: `HomeFacilitiesStatus` → `FacilityLocationCard` → `FacilityUnitGrid` (numbered dot grid). Admin: `FacilityStatusForm` (tap each numbered unit to toggle; "mark all open/out"; bathroom-closed checkbox; optional detail notes per section).
- East & West have one **outside pet washer**; every building has one **hot water heater**; Office & Ranch House has a kitchen (sink + oven), no laundry.

### Map, valves, lots, sites
- Interactive park map (`/map`) with Google Maps when configured, else a built-in PNG schematic. Manager editor at `/map/edit`.
- **Valves** (`/valves`) and **lots** (`/lots`) are synced from a Google Sheet (valve/zone/CCCP tabs) via `/api/sheets/sync` and `/api/lots/sync`.
- **Sites** (`/sites`) are named park amenities/system places with map positions.
- Map libs are numerous (`map-*.ts`): geography, coords, positions, viewport, zones, edit history/validation.

### Weather & sky
- `/weather` themed page; `park-weather.ts`, `weather-condition-*.ts`, layered mascot (`weather-mascot-*.ts`).
- Sky & space: APOD (NASA), NWS alerts, moon phase, earthquakes (USGS). `/api/weather` and `/api/sky` serve cached data.

### Content: posts, articles, assessments
- **Posts** — feed entries with title/body/location/photos, sections (landscaping/maintenance), tags, poster avatar. Libs: `posts.ts`, `feed.ts`, `post-*.ts`, `content-*.ts`.
- **Articles** — knowledge base with related links and site references. `articles.ts`, `article-*.ts`.
- **Assessments** — tree and maintenance assessment records with structured fields, how-found, resolution. `tree-assessments.ts`, `maintenance-assessments.ts`.

### Pickup guidelines & schedule
- `/pickup-guidelines` green-waste banner + summer schedule toggle (`pickup-*.ts`).
- `/schedule` maintenance calendar synced daily from Google Calendar.

### Work requests
- **Submit Request** nav links to MaintainX when `NEXT_PUBLIC_MAINTAINX_URL` is set; `/request` redirects there. See [docs/work-request-portal.md](work-request-portal.md). MaintainX can't be iframed, so it's an external link.

---

## Data model (migrations)

Migrations live in `supabase/migrations/` and run in filename order. Highlights:

| Migration | Adds |
| --- | --- |
| `20260604043453_initial_schema` | `profiles`, `posts`, `galleries`, `gallery_images`, triggers, Storage bucket |
| `20260604043520_public_access_and_whitelist` | Public-read RLS + `authorized_emails` whitelist |
| `20260604043625_security_hardening` | Advisor fixes |
| `20260604063434/063518_posts_*` | Post images/threads, categories |
| `20260605000000_articles` | Articles |
| `20260606000000_posts_title_body_location` | Post title/body/location |
| `20260607000000_drop_galleries` | Removes galleries |
| `20260608–20260611_tree_assessments*` | Tree assessments + how-found + resolution |
| `20260612000000_maintenance_assessments` | Maintenance assessments |
| `20260615000000_content_tags` | Tags |
| `20260617–20260620_*_poster_avatar` | Poster avatars for posts/articles/assessments |
| `20260622000000_calendar_events` | Calendar events (schedule) |
| `20260623000000_pickup_guidelines` | Pickup guidelines |
| `20260624000000_feed_sections` | Feed sections |
| `20260625000000_water_usage` | Water usage |
| `20260626000000_lots` | Lots |
| `20260626235617_staff_roles` | **Staff role tiers** (`staff_role` enum, `has_staff_role()`) |
| `20260627000000_water_monthly_report` | Water monthly report |
| `20260627000000_sites_map_positions` | Sites + map positions |
| `20260628000000_location_photos` | Location photos |
| `20260628000000_map_hidden_lots` | Hidden lots on map |
| `20260629000000_article_related_and_site` | Article relations + site refs |
| `20260630100000_announcements` | Announcements |
| `20260630120000_utility_status` | Water/power status |
| `20260630130000_laundry_status` | Laundry status (superseded) |
| `20260630140000_announcement_alert_type` | Alert type on announcements |
| `20260630150000_restroom_status` | Restroom status (superseded) |
| `20260630160000_park_facility_status` | **Unified buildings + restrooms** (laundry, kitchen, hot water, pet washers) |
| `20260630170000_facility_individual_units` | **Per-unit `*_statuses` JSON + restroom `closed`** |

> Facility note: `20260630160000` rebuilds the facility tables; `20260630170000` migrates the old aggregate "N out of order" counts into per-unit arrays and drops the count columns. Apply both to bring a project current.

---

## API routes

All under `src/app/api/`:

| Route | Purpose | Auth |
| --- | --- | --- |
| `/api/weather` | Cached park weather | public (revalidated) |
| `/api/sky` | Cached sky/space data (APOD, alerts, moon) | public (revalidated) |
| `/api/power/outages` | Cached SCE nearby outages | public (revalidated) |
| `/api/calendar/sync` | Pull Google Calendar → `calendar_events` | cron secret |
| `/api/sheets/sync?type=all\|water\|valves` | Pull Google Sheets → water report / valves | cron secret |
| `/api/water/sync` | Water usage sync | staff |
| `/api/lots/sync`, `/api/lots/[slug]/notes` | Lot sync + per-lot notes | staff |
| `/api/valves`, `/api/valves/[valveId]` | Valve data | mixed |
| `/api/map`, `/api/map/sync`, `/api/map/image` | Map data, sync, generated image | mixed |
| `/api/sites/[slug]` | Site profile data | public |
| `/api/location-photos` | Location photo upload/list | staff |
| `/api/webhooks/calendar` | Google Calendar push webhook | webhook token |

Auth helpers: `src/lib/cron-auth.ts` (`CRON_SECRET`), `src/lib/staff-api-auth.ts`, `src/lib/require-staff-role.ts`.

---

## External integrations

| Service | Used for | Required vars |
| --- | --- | --- |
| **Supabase** | Auth, Postgres, Storage | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server) |
| **Google OAuth** | Staff sign-in | configured in Supabase Auth |
| **Google Calendar** | `/schedule` events (daily sync + webhook) | `GOOGLE_SERVICE_ACCOUNT_JSON` (or split email/key), `GOOGLE_CALENDAR_ID` |
| **Google Sheets** | Valves/zones/lots + water monthly report | `GOOGLE_VALVE_SHEET_ID`, `GOOGLE_WATER_SHEET_ID`, `GOOGLE_WATER_SHEET_GID` |
| **MaintainX** | Work-request portal link | `NEXT_PUBLIC_MAINTAINX_URL` |
| **Google Maps** | Interactive map (optional) | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAP_ID` |
| **NASA APOD** | Sky page picture of the day | `NASA_API_KEY` (falls back to `DEMO_KEY`) |
| **NWS** | Weather alerts | `NWS_USER_AGENT` (contact string) |
| **USGS / SCE** | Earthquakes / power outages | none (public feeds) |
| **Facebook group** | Share buttons | `NEXT_PUBLIC_FACEBOOK_GROUP_URL` |

All Google sync uses one service account (`googleapis`). Share each calendar/sheet with the service-account email.

---

## Environment variables

Copy `.env.example` → `.env.local`. `NEXT_PUBLIC_*` vars reach the browser; everything else is server-only. **Never** commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY`.

**Required (core):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (OAuth callback base; must be the real site URL in production)

**Server-only (features):**
- `SUPABASE_SERVICE_ROLE_KEY` — calendar webhook, sheet sync writes
- `CRON_SECRET` — guards `/api/calendar/sync` and `/api/sheets/sync`
- `GOOGLE_SERVICE_ACCOUNT_JSON` (or `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`)
- `GOOGLE_CALENDAR_ID`, optional `GOOGLE_CALENDAR_WEBHOOK_TOKEN`, `GOOGLE_CALENDAR_WEBHOOK_URL`
- `GOOGLE_VALVE_SHEET_ID` (alias `GOOGLE_SHEETS_ID`)
- `GOOGLE_WATER_SHEET_ID`, `GOOGLE_WATER_SHEET_GID`, optional `GOOGLE_WATER_SHEET_RANGE`
- `NWS_USER_AGENT`, `NASA_API_KEY`

**Public (optional):**
- `NEXT_PUBLIC_MAINTAINX_URL`, `NEXT_PUBLIC_FACEBOOK_GROUP_URL`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAP_ID`
- `NEXT_PUBLIC_PARK_MAP_BOUNDS`, `NEXT_PUBLIC_PARK_FOCUS_BOUNDS`, `NEXT_PUBLIC_PARK_VIEW_BOUNDS`, `NEXT_PUBLIC_PARK_FOCUS_CENTER`

Helper scripts: `scripts/verify-google-env.mjs` checks Google vars; `scripts/debug-water-*.mjs` and `inspect-monthly-report.mjs` debug the water sheet.

---

## Scheduled jobs (cron)

Defined in `vercel.json`:

| Path | Schedule | Does |
| --- | --- | --- |
| `/api/calendar/sync` | `0 0 * * *` (daily midnight) | Refresh `/schedule` from Google Calendar |
| `/api/sheets/sync?type=all` | `0 0 * * 0` (weekly, Sunday) | Refresh water monthly report + valves/lots |

Both require the `CRON_SECRET` header (Vercel sends it automatically for cron).

---

## Project structure

```
src/
  app/
    (public)/            # public pages (navbar layout)
      page.tsx           # home dashboard
      feed/ articles/ water/ weather/ map/ sites/ valves/ lots/
      schedule/ pickup-guidelines/ request/ posts/ tree-assessments/
      maintenance-assessments/
    admin/               # staff-only (guarded by layout: auth + role)
      page.tsx           # hub + post uploader
      announcements/ facilities-status/ water-status/ power-status/
      articles/ tree-assessments/ maintenance-assessments/ pickup-guidelines/
    api/                 # route handlers (see API routes)
    auth/ login/         # OAuth flow + sign-in
    layout.tsx
  components/            # ~all UI (status cards, forms, map, weather, feed…)
  lib/                   # domain logic, Supabase clients, integrations, helpers
  proxy.ts               # session refresh + /admin gate (Next 16 proxy)
supabase/migrations/     # ordered SQL schema + RLS
public/assets/           # logos, mascot art, status/weather icons
docs/                    # focused docs (this bible, work-request, text-alerts)
scripts/                 # Google env + water sheet debug utilities
```

---

## Staff how-to guide

You need a whitelisted Google account. After signing in, the **Dashboard** link and admin hub appear. Most tasks below need **manager**; posting needs **staff**.

### Post an update to the feed
1. Dashboard → **Landscaping post** or **Maintenance post**.
2. Add a short description and a photo (camera or file). Images compress automatically.
3. For a fuller writeup, use the structured fields (title, body, location, tags). Post — it appears on `/feed`.

### Raise a park alert (water, power, or general)
1. Dashboard → **Park alerts** → **New**.
2. Pick the **alert type** (e.g. water shutoff/planned, power outage/planned, or general notice) and **severity** (info / notice / urgent).
3. Write the title and body; set an end time if known. Publish.
4. The alert shows on the home **Park alerts** board, and water/power cards automatically re-tone. **End alert** when resolved.

> Turning water **off** (active or planned shutoff) automatically closes all laundry and restrooms site-wide until you clear it.

### Update laundry / restroom / hot water status
1. Dashboard → **Laundry & restrooms** (`/admin/facilities-status`).
2. For each building, tap the **numbered unit buttons** to flip a specific washer, dryer, shower, toilet, urinal, sink, water heater, or oven between **Open** and **Out**.
3. Use **Mark all open / Mark all out** for bulk changes, or the **Bathroom closed** checkbox to close a whole room.
4. Add optional **detail notes** (e.g. "Toilet 2 — clogged"). Save. The home card shows exactly which units are down.

### Manage articles & assessments
- **Articles** — Dashboard → New article / Articles. Markdown-based, supports images, related links, and a site reference.
- **Tree / Maintenance assessments** — Dashboard → New … / manage lists. Structured records with how-found and resolution.

### Edit the park map
- Dashboard → **Park map** (opens `/map`), then `/map/edit` to move lots/places and adjust layers (manager+).

### Sync water usage
- Dashboard → **Water usage** (`/water`). The weekly cron refreshes automatically; managers can trigger a manual sync. Source is the shared Google Sheet.

### Update pickup guidelines
- Dashboard → **Pickup guidelines**. Edit the green-waste banner text and toggle the summer schedule.

---

## Conventions for developers

- **Next.js 16 is not your training data.** Read the relevant guide in `node_modules/next/dist/docs/` before using framework APIs; heed deprecations. The middleware file is `src/proxy.ts` ("proxy"), not `middleware.ts`.
- **Imports at the top** of every module — no inline imports (see `AGENTS.md`).
- **Exhaustive switches** over unions/enums use a `never` default so new variants fail to compile until handled (see `FacilityUnitGrid` icons).
- **Type-check before shipping:** `npx tsc --noEmit`. Run `npm run build` for a full verification. Fix lints in files you touched (`ReadLints`).
- **Supabase clients:** `lib/supabase/client.ts` (browser), `server.ts` (server components), `middleware.ts` (proxy), `admin.ts` (service-role, server-only).
- **RLS first:** new tables get public SELECT + `has_staff_role(...)` write policies, plus an `updated_at` trigger.
- **Status tone vocabulary:** `ok` (green) / `warn` (amber) / `alert` (red) / `info` (brand) — consistent across status cards and `StatusArt`/`StatusIcon`.
- **PowerShell note:** the dev environment shell is PowerShell — chain with `;`, not `&&`, and avoid bash heredocs.

---

## Other docs

- [README.md](../README.md) — install, Supabase setup, Google auth, deploy.
- [docs/work-request-portal.md](work-request-portal.md) — MaintainX integration.
- [docs/emergency-text-alerts.md](emergency-text-alerts.md) — proposed auto-ingest of office emergency texts as urgent alerts (not built yet).
- Asset specs: `public/assets/status/README.md`, `public/assets/mascot/README.md`, `public/assets/weather/icons/README.md`.
