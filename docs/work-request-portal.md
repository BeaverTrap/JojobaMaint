# Work request portal (MaintainX)

**Submit Request** in the nav links straight to the MaintainX portal when `NEXT_PUBLIC_MAINTAINX_URL` is set (opens in a new tab). The [`/request`](../src/app/(public)/request/page.tsx) route redirects to the same URL for bookmarks; if the env var is missing, `/request` shows an offline placeholder.

MaintainX does not allow embedding in iframes (`X-Frame-Options`), so the portal is an external link, not an in-app page.

---

## Quick setup

1. **Get your MaintainX portal URL** from MaintainX (public work-request / portal link for your organization).

2. **Add the environment variable** locally in `.env.local`:

   ```env
   NEXT_PUBLIC_MAINTAINX_URL=https://app.getmaintainx.com/work-request/your-portal-id
   ```

3. **Restart the dev server** (`npm run dev`). Next.js reads `NEXT_PUBLIC_*` variables at startup/build time.

4. **Production (Vercel):** add the same variable under **Project → Settings → Environment Variables** for Production (and Preview if you want it on preview deploys). Redeploy after saving.

5. Click **Submit Request** in the nav — MaintainX opens in a new tab.

---

## Behavior

| `NEXT_PUBLIC_MAINTAINX_URL` | What users see |
| --- | --- |
| Set to a valid `http:` or `https:` URL | Nav opens MaintainX in a new tab; `/request` redirects there |
| Missing or invalid | `/request` shows an offline placeholder; nav still points to `/request` |

The URL is validated server-side (`src/lib/maintainx.ts`). Only `http:` and `https:` schemes are accepted.

---

## Navigation

- **Desktop:** green **Submit Request** button in the top navbar (external link when configured).
- **Mobile:** **Request** tab in the bottom nav; also listed in the overflow menu.
- The **weekly pickup banner** still appears on `/request` when the portal is not configured.

---

## Security notes

- The portal URL is public (`NEXT_PUBLIC_*`) — use only MaintainX’s **public** work-request link, not admin or API credentials.
- MaintainX blocks iframe embedding; residents use an external link with `rel="noopener noreferrer"`.

---

## Troubleshooting

| Problem | Things to check |
| --- | --- |
| Still shows offline placeholder | Variable name spelled `NEXT_PUBLIC_MAINTAINX_URL`; dev server restarted; no typos or quotes issues in `.env.local` |
| Works locally, not on Vercel | Variable set in Vercel env for the right environment; redeploy after adding it |
| Button does nothing | `NEXT_PUBLIC_MAINTAINX_URL` missing or invalid; check `.env.local` / Vercel and redeploy |
| Portal errors in new tab | Confirm the MaintainX URL opens when pasted directly in the browser |

---

## Related files

| File | Purpose |
| --- | --- |
| `src/app/(public)/request/page.tsx` | Page shell, welcome copy, and portal button |
| `src/components/RequestPortalPlaceholder.tsx` | Offline UI |
| `src/lib/maintainx.ts` | Reads and validates `NEXT_PUBLIC_MAINTAINX_URL` |
| `.env.example` | Example env entry |
