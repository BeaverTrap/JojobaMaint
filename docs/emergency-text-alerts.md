# Emergency text alerts

The park office sends emergency text messages (water shutoffs, power interruptions, fire/evacuation, etc.) to residents. This doc covers how we could pipe those same alerts into JojobaWorks so they automatically appear as an **urgent Park alert** on the home page.

> Status: **not built yet** — pending answers from the office about how their text system works (see [Questions for the office](#questions-for-the-office)).

---

## The idea

When the office sends an emergency text, JojobaWorks receives the same message through some channel (email, webhook, or SMS) and automatically creates a row in the `announcements` table with:

- `severity = 'urgent'`
- `published = true`
- `title` / `body` from the message
- an optional source label (e.g. "Office text alert")
- an optional auto-expiry (`ends_at`) so stale alerts clear themselves

The existing **Park alerts** board on the home page then shows it immediately, with no manual posting required.

---

## Integration options (best → last resort)

### 1. Email-to-alert (usually easiest)

If the text system can also send each alert to an **email address**:

1. Ask the office to add an address like `alerts@jojobaworks.app` (or a forwarding address) as a recipient on the emergency text list.
2. Use an inbound-email provider (e.g. **Resend inbound**, **SendGrid Inbound Parse**, **Postmark**, or a Cloudflare Email Worker) that POSTs incoming mail to a webhook.
3. The webhook parses subject/body and inserts an `announcements` row.

**Pros:** cheap, no phone number to manage. **Cons:** depends on the text system supporting an email recipient.

### 2. Webhook / API (cleanest if supported)

If the office uses a messaging platform (Twilio, Textedly, EZ Texting, OneCallNow, RainedOut, etc.), many support **webhooks** or an outbound API.

1. Point their system's webhook at `POST /api/alerts/inbound` (to be built).
2. Verify a shared secret/signature, then create the alert.

**Pros:** most reliable and structured. **Cons:** depends on the platform's features; may need an account/plan.

### 3. Dedicated SMS number (Twilio)

If it's just a phone/group text list:

1. Provision a **Twilio** phone number.
2. Ask the office to add that number to the emergency alert list.
3. Configure Twilio's **inbound SMS webhook** → `POST /api/alerts/inbound` → create the alert.

**Pros:** works with a plain text list. **Cons:** monthly number cost + per-message SMS cost; carrier filtering can drop bulk messages.

### 4. Reading texts off a personal phone — avoid

Scraping SMS from someone's personal phone is brittle, privacy-sensitive, and not production-grade. Don't do this unless there is truly no other path, and even then prefer a dedicated device + provider.

---

## Proposed implementation (once a channel is chosen)

1. **Inbound endpoint:** `POST /api/alerts/inbound`
   - Auth via shared secret header or provider signature verification.
   - Body: `{ title?, message, source?, expiresInHours? }` (shape adapts to provider).
2. **Insert** into `announcements` using the service-role client (bypasses RLS for the trusted server route):
   - `severity = 'urgent'`, `published = true`, `starts_at = now()`,
   - `ends_at = now() + expiresInHours` when provided,
   - `title` defaults to "Emergency alert" if the source only sends a body.
3. **De-dupe** on a hash of (message + minute) to avoid duplicates from retries.
4. **Optional review flag:** insert as `published = false` if the office wants a human to confirm before it goes live.
5. **Audit:** log source + raw payload (without secrets) for traceability.

Env vars (names TBD): `ALERT_INBOUND_SECRET`, plus provider-specific keys (e.g. `TWILIO_AUTH_TOKEN`).

---

## Questions for the office

- What system/app sends the emergency texts?
- Can it add an **email recipient** to the alert list?
- Can it add a **webhook / API endpoint**?
- Can it add a **phone number** to the same alert list?
- Are alerts **one-way only**, or do residents reply (affects number type/cost)?
- Roughly how often are alerts sent, and how long should each stay visible?

---

## Related

- Park alerts model: `announcements` table + admin at `/admin/announcements`.
- Home board: [`src/components/AnnouncementBoard.tsx`](../src/components/AnnouncementBoard.tsx).
- Fetch helpers: [`src/lib/announcements.ts`](../src/lib/announcements.ts).
