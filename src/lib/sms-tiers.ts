import type { ResidentAlertTier } from "@/lib/database.types";

/** How important / broad this SMS is (set per message or template). */
export type SmsMessageTier = "critical" | "standard" | "announcement";

export const SMS_MESSAGE_TIERS: SmsMessageTier[] = [
  "critical",
  "standard",
  "announcement",
];

export const MESSAGE_TIER_OPTIONS: {
  value: SmsMessageTier;
  label: string;
  description: string;
}[] = [
  {
    value: "critical",
    label: "Emergency",
    description:
      "Everyone — including residents who only want urgent alerts.",
  },
  {
    value: "standard",
    label: "Park notice",
    description:
      "Standard and frequent-update residents. Skips emergency-only.",
  },
  {
    value: "announcement",
    label: "Newsletter / drip",
    description:
      "Only residents who opted into frequent park updates.",
  },
];

/** Whether a resident's contact preference allows this message tier. */
export function residentReceivesMessageTier(
  residentTier: ResidentAlertTier,
  messageTier: SmsMessageTier,
): boolean {
  switch (messageTier) {
    case "critical":
      return true;
    case "standard":
      return (
        residentTier === "standard" || residentTier === "high_communication"
      );
    case "announcement":
      return residentTier === "high_communication";
    default: {
      const _exhaustive: never = messageTier;
      return _exhaustive;
    }
  }
}

export function messageTierLabel(tier: SmsMessageTier): string {
  return MESSAGE_TIER_OPTIONS.find((option) => option.value === tier)?.label ?? tier;
}

export function parseMessageTier(value: unknown): SmsMessageTier {
  if (
    typeof value === "string" &&
    SMS_MESSAGE_TIERS.includes(value as SmsMessageTier)
  ) {
    return value as SmsMessageTier;
  }
  return "critical";
}
