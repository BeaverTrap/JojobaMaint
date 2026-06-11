import { NextResponse } from "next/server";
import { PARK_MAP_IMAGE_PATH } from "@/lib/map-constants";

/** Redirect to the static asset in public/ (reliable on Vercel). */
export async function GET(request: Request) {
  const url = new URL(PARK_MAP_IMAGE_PATH, request.url);
  return NextResponse.redirect(url, 307);
}
