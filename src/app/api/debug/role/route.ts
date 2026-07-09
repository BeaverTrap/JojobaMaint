import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { DEBUG_ROLE_COOKIE, DEBUG_PUBLIC_VALUE } from "@/lib/debug-mode";
import { STAFF_ROLES } from "@/lib/staff-roles";
import type { StaffRole } from "@/lib/staff-roles";

export async function POST(req: NextRequest) {
  const { staffRole } = await getCurrentUser();
  if (staffRole !== "webmaster") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const role = body.role as string | null;

  const jar = await cookies();

  if (!role || role === "webmaster") {
    jar.delete(DEBUG_ROLE_COOKIE);
    return NextResponse.json({ role: null });
  }

  const validValues = [...STAFF_ROLES, DEBUG_PUBLIC_VALUE];
  if (!validValues.includes(role as StaffRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  jar.set(DEBUG_ROLE_COOKIE, role, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 4,
  });

  return NextResponse.json({ role });
}
