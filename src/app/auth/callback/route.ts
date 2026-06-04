import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback. Supabase redirects here with a `code` that we exchange for a
 * session. We then re-sync the user's authorization against the staff
 * whitelist (server-side, via a SECURITY DEFINER RPC) so newly-added employees
 * are recognized on their next login.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Returns true if the email is on the whitelist. The client cannot set
      // this itself — is_authorized is only writable by trusted DB code.
      const { data: isAuthorized } = await supabase.rpc(
        "sync_my_authorization",
      );

      // Honor an explicit ?next=, otherwise send staff to the dashboard and
      // everyone else to the public feed.
      const dest = next ?? (isAuthorized ? "/admin" : "/");
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
