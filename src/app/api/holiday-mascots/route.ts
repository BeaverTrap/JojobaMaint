import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type HolidayMascotRow = {
  id: string;
  label: string;
  src: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  calendar_month: number | null;
  calendar_day: number | null;
  calendar_end_month: number | null;
  calendar_end_day: number | null;
  holiday_name: string | null;
  year: number | null;
  active: boolean;
  sort_order: number;
};

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_holiday_mascots")
    .select("id, label, src, start_month, start_day, end_month, end_day, calendar_month, calendar_day, calendar_end_month, calendar_end_day, holiday_name, year, active, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { isWebmaster, userId } = await getCurrentUser();
  if (!isWebmaster || !userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { label, src, start_month, start_day, end_month, end_day } = body as {
    label: string;
    src: string;
    start_month: number;
    start_day: number;
    end_month: number;
    end_day: number;
  };

  if (!label || !src || !start_month || !start_day || !end_month || !end_day) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_holiday_mascots")
    .insert({
      label,
      src,
      start_month,
      start_day,
      end_month,
      end_day,
      created_by: userId,
    })
    .select("id, label, src, start_month, start_day, end_month, end_day, calendar_month, calendar_day, calendar_end_month, calendar_end_day, holiday_name, year, active, sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const { isWebmaster } = await getCurrentUser();
  if (!isWebmaster) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...updates } = body as HolidayMascotRow & { id: string };

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_holiday_mascots")
    .update(updates)
    .eq("id", id)
    .select("id, label, src, start_month, start_day, end_month, end_day, calendar_month, calendar_day, calendar_end_month, calendar_end_day, holiday_name, year, active, sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { isWebmaster } = await getCurrentUser();
  if (!isWebmaster) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_holiday_mascots")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
