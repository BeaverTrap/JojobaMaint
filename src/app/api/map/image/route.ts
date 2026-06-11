import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const MAP_IMAGE_FILENAME = "park_map_clean.png";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "images",
      MAP_IMAGE_FILENAME,
    );
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Map image not found" }, { status: 404 });
    }
    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (e) {
    console.error("Error serving map image:", e);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
