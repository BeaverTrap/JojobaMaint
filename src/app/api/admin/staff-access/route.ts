import { NextResponse } from "next/server";
import type { StaffRole } from "@/lib/database.types";
import {
  canActorAssignRole,
  requireStaffAccessActor,
} from "@/lib/staff-access-auth";
import {
  fetchAuthorizedEmails,
  isValidWhitelistEmail,
  normalizeWhitelistEmail,
} from "@/lib/staff-access";
import { parseStaffRole } from "@/lib/staff-roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const actor = await requireStaffAccessActor();
  if (!actor.ok) {
    return NextResponse.json({ error: actor.error }, { status: actor.status });
  }

  try {
    const supabase = createAdminClient();
    const rows = await fetchAuthorizedEmails(supabase);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not load staff access",
      },
      { status: 500 },
    );
  }
}

type UpsertBody = {
  email?: string;
  staff_role?: StaffRole;
  note?: string | null;
};

export async function POST(request: Request) {
  const actor = await requireStaffAccessActor();
  if (!actor.ok) {
    return NextResponse.json({ error: actor.error }, { status: actor.status });
  }

  let body: UpsertBody;
  try {
    body = (await request.json()) as UpsertBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = normalizeWhitelistEmail(body.email ?? "");
  const staffRole = parseStaffRole(body.staff_role) ?? "staff";
  const note = body.note?.trim() || null;

  if (!isValidWhitelistEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  if (!canActorAssignRole(actor.staffRole, staffRole)) {
    return NextResponse.json(
      { error: "You cannot assign that role" },
      { status: 403 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("authorized_emails")
      .upsert({ email, staff_role: staffRole, note })
      .select("email, note, staff_role, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ row: data });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not save staff access",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const actor = await requireStaffAccessActor();
  if (!actor.ok) {
    return NextResponse.json({ error: actor.error }, { status: actor.status });
  }

  let body: UpsertBody;
  try {
    body = (await request.json()) as UpsertBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = normalizeWhitelistEmail(body.email ?? "");
  if (!isValidWhitelistEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  const updates: { staff_role?: StaffRole; note?: string | null } = {};
  if (body.staff_role !== undefined) {
    const staffRole = parseStaffRole(body.staff_role);
    if (!staffRole) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (!canActorAssignRole(actor.staffRole, staffRole)) {
      return NextResponse.json(
        { error: "You cannot assign that role" },
        { status: 403 },
      );
    }
    updates.staff_role = staffRole;
  }
  if (body.note !== undefined) {
    updates.note = body.note?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("authorized_emails")
      .update(updates)
      .eq("email", email)
      .select("email, note, staff_role, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ row: data });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not update staff access",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const actor = await requireStaffAccessActor();
  if (!actor.ok) {
    return NextResponse.json({ error: actor.error }, { status: actor.status });
  }

  const { searchParams } = new URL(request.url);
  const email = normalizeWhitelistEmail(searchParams.get("email") ?? "");
  if (!isValidWhitelistEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data: existing, error: readError } = await supabase
      .from("authorized_emails")
      .select("staff_role")
      .eq("email", email)
      .maybeSingle();

    if (readError) throw readError;
    if (!existing) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const targetRole = parseStaffRole(existing.staff_role);
    if (targetRole && !canActorAssignRole(actor.staffRole, targetRole)) {
      return NextResponse.json(
        { error: "You cannot remove that user" },
        { status: 403 },
      );
    }

    const { error } = await supabase
      .from("authorized_emails")
      .delete()
      .eq("email", email);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not remove staff access",
      },
      { status: 500 },
    );
  }
}
