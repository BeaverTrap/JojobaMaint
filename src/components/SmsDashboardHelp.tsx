import { SMS_GSM_LIMIT, SMS_UCS2_LIMIT } from "@/lib/sms-composer";
import { isWebmasterRole, type StaffRole } from "@/lib/staff-roles";

/**
 * Collapsible reference for the Emergency SMS Dashboard.
 * Kept in one place so section headers stay short and operators can drill in here.
 */
export default function SmsDashboardHelp({
  viewerRole,
}: {
  viewerRole: StaffRole;
}) {
  const canConfigureGemini = isWebmasterRole(viewerRole);

  return (
    <details
      className="group rounded-2xl border border-brand-200 bg-brand-50/50 shadow-sm dark:border-brand-900/50 dark:bg-brand-950/25"
    >
      <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink">
            How this dashboard works
          </span>
          <span className="text-xs font-medium text-brand-800 group-open:hidden dark:text-brand-200">
            Show full guide
          </span>
          <span className="hidden text-xs font-medium text-brand-800 group-open:inline dark:text-brand-200">
            Hide guide
          </span>
        </span>
      </summary>

      <div className="space-y-5 border-t border-brand-200/80 px-4 py-4 text-xs leading-relaxed text-muted dark:border-brand-900/50">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Quick start</h3>
          <ol className="list-decimal space-y-1.5 pl-4">
            <li>
              Pick a saved template (optional) or write a new message in the
              composer.
            </li>
            <li>
              Set the <strong className="text-ink">message type</strong>{" "}
              (Emergency or Park notice) so residents who opted out of that level
              are skipped automatically.
            </li>
            <li>
              Optionally tap <strong className="text-ink">Google Gemini</strong>{" "}
              to rewrite your draft into professional alert wording.
            </li>
            <li>
              Tap <strong className="text-ink">Send Mass Alert</strong>. Review
              the confirmation — it shows exactly how many phones will receive
              the message.
            </li>
            <li>
              Check the <strong className="text-ink">audit log</strong> at the
              bottom for delivery results.
            </li>
          </ol>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Saved templates</h3>
          <p>
            Templates store a title, message text, and default message type. Tap{" "}
            <strong className="text-ink">Use</strong> to copy one into the
            composer below — you can still edit before sending. Create templates
            for recurring situations (water shutoff, power outage, gate closure)
            so you are not rewriting from scratch during an emergency.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Who to text</h3>
          <p>
            Every send goes to <strong className="text-ink">all residents</strong>{" "}
            with a valid phone number in the residents list. Message type still
            filters who actually receives the text based on each person&apos;s
            contact preference.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">
            Message type vs contact preference
          </h3>
          <p>
            Each resident has a contact preference stored on their record:
            emergency-only or standard (emergencies + park notices). When you
            send, you pick what kind of message this is:
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <strong className="text-ink">Emergency</strong> — goes to everyone,
              including emergency-only residents.
            </li>
            <li>
              <strong className="text-ink">Park notice</strong> — standard
              residents only; skips emergency-only.
            </li>
          </ul>
          <p>
            The confirmation dialog tells you how many people were skipped because
            of this filter.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">
            Composer, Gemini &amp; character limits
          </h3>
          <p>
            This is a <strong className="text-ink">mass text</strong>: you write
            one message and the system sends it to everyone who matches your
            message type. Plain text is limited to{" "}
            <strong className="text-ink">{SMS_GSM_LIMIT} characters</strong> per
            SMS segment. If you add emoji, the limit drops to{" "}
            <strong className="text-ink">{SMS_UCS2_LIMIT} characters</strong>{" "}
            (UCS-2 encoding) — the counter updates automatically.
          </p>
          <p>
            <strong className="text-ink">Google Gemini</strong>{" "}
            {canConfigureGemini ? (
              <>
                (via{" "}
                <code className="rounded bg-hover px-1 py-0.5 text-ink">
                  GEMINI_API_KEY
                </code>
                ) takes your draft and returns a clearer, more professional
                version suited for a park alert.
              </>
            ) : (
              <>
                rewrites your draft into clearer, professional alert wording.
                Contact your webmaster if it is not working.
              </>
            )}{" "}
            Google may require billing or prepaid credits on the key — see{" "}
            <a
              href="https://ai.google.dev/gemini-api/docs/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-700 hover:underline dark:text-brand-300"
            >
              Gemini billing
            </a>
            . Review the result before sending; you are always responsible for
            the final text.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Delivery &amp; landlines</h3>
          <p>
            Messages go out through Twilio as SMS. If a number is a landline and
            SMS fails, the system automatically tries a one-way voice call that
            reads the message aloud. The audit log shows how many used voice
            fallback.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Audit log</h3>
          <p>
            Every send is recorded: who sent it, when, message type, how many
            succeeded or failed, and the message text that was used. Use this to
            verify a blast went out and to troubleshoot individual failures.
          </p>
        </section>
      </div>
    </details>
  );
}
