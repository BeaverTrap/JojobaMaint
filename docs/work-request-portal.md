# Work request portal (MaintainX)

The public **Submit a Work Request** page lives at [`/request`](../src/app/(public)/request/page.tsx). It links out to an external MaintainX portal when configured, or shows an offline placeholder until the URL is set.

MaintainX does not allow embedding in iframes (`X-Frame-Options`), so the portal opens in a **new browser tab** instead.

---

## Quick setup

1. **Get your MaintainX portal URL** from MaintainX (public work-request / portal link for your organization).

2. **Add the environment variable** locally in `.env.local`:

   ```env
   NEXT_PUBLIC_MAINTAINX_URL=https://app.getmaintainx.com/work-request/your-portal-id
   ```

3. **Restart the dev server** (`npm run dev`). Next.js reads `NEXT_PUBLIC_*` variables at startup/build time.

4. **Production (Vercel):** add the same variable under **Project → Settings → Environment Variables** for Production (and Preview if you want it on preview deploys). Redeploy after saving.

5. Open **`/request`** — click **Open Work Request Portal** to launch MaintainX in a new tab.

---

## Behavior

| `NEXT_PUBLIC_MAINTAINX_URL` | What users see on `/request` |
| --- | --- |
| Set to a valid `http:` or `https:` URL | Welcome message and **Open Work Request Portal** button (new tab) |
| Missing or invalid | Styled offline message: “Request portal offline — please check back later.” |

The URL is validated server-side (`src/lib/maintainx.ts`). Only `http:` and `https:` schemes are accepted.

---

## Navigation

- **Desktop:** green **Submit Request** button in the top navbar.
- **Mobile:** **Request** tab in the bottom nav; also listed in the overflow menu.
- The **weekly pickup banner** appears on `/request` (same as Feed and Schedule).

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
