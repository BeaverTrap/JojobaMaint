import { NextResponse } from "next/server";
import { requireSmsAdmin } from "@/lib/sms-auth";
import { SMS_GSM_LIMIT } from "@/lib/sms-composer";

type PolishBody = { draft?: string };

export async function POST(request: Request) {
  const auth = await requireSmsAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  let body: PolishBody;
  try {
    body = (await request.json()) as PolishBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const draft = body.draft?.trim() ?? "";
  if (!draft) {
    return NextResponse.json({ error: "Draft message is required" }, { status: 400 });
  }

  const prompt = [
    "Rewrite this emergency park SMS alert to be professional, clear, and concise.",
    `Hard limit: ${SMS_GSM_LIMIT} characters. No emojis.`,
    "Return ONLY the rewritten message text — no quotes, labels, or explanation.",
    "",
    draft,
  ].join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 120,
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: `Gemini API error: ${detail.slice(0, 200)}` },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const polished =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!polished) {
      return NextResponse.json(
        { error: "Gemini returned an empty response" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: polished.slice(0, SMS_GSM_LIMIT),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not polish message",
      },
      { status: 502 },
    );
  }
}
