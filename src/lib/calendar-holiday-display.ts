import { getFederalPickupHolidayLabel } from "@/lib/pickup-holidays";

export type CalendarHolidayMascotInput = {
  id: string;
  label: string;
  src: string;
  start_month?: number;
  start_day?: number;
  end_month?: number;
  end_day?: number;
  calendar_month: number | null;
  calendar_day: number | null;
  calendar_end_month?: number | null;
  calendar_end_day?: number | null;
  holiday_name?: string | null;
  year?: number | null;
};

export type CalendarDayHoliday = {
  tintClass: string | null;
  label: string | null;
  mascotSrc: string | null;
  mascotAlt: string | null;
};

const TINT = {
  hanukkah: "bg-blue-100/90 dark:bg-blue-950/55",
  pride: "bg-fuchsia-100/90 dark:bg-fuchsia-950/55",
  christmas: "bg-rose-100/90 dark:bg-rose-950/55",
  newYear: "bg-sky-100/90 dark:bg-sky-950/55",
  patriotic: "bg-red-100/90 dark:bg-red-950/55",
  federal: "bg-slate-200/80 dark:bg-slate-800/60",
  default: "bg-brand-100/80 dark:bg-brand-950/45",
} as const;

type TintClass = (typeof TINT)[keyof typeof TINT];

const TEXT_HOLIDAYS: Record<string, { label: string; tint: string }> = {
  "2-14": { label: "Valentine's Day", tint: TINT.default },
  "3-17": { label: "St. Patrick's Day", tint: TINT.default },
  "5-5": { label: "Cinco de Mayo", tint: TINT.default },
};

const LINKED_HOLIDAYS: {
  tint: string;
  members: { month: number; day: number; label: string }[];
}[] = [
  {
    tint: TINT.christmas,
    members: [
      { month: 12, day: 24, label: "Christmas Eve" },
      { month: 12, day: 25, label: "Christmas" },
    ],
  },
  {
    tint: TINT.newYear,
    members: [
      { month: 12, day: 31, label: "New Year's Eve" },
      { month: 1, day: 1, label: "New Year's Day" },
    ],
  },
  {
    tint: TINT.patriotic,
    members: [{ month: 7, day: 4, label: "Independence Day" }],
  },
];

function dayKey(month: number, day: number): string {
  return `${month}-${day}`;
}

function isInCalendarSpan(
  month: number,
  day: number,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): boolean {
  const val = month * 100 + day;
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;
  if (start <= end) return val >= start && val <= end;
  return val >= start || val <= end;
}

function eachDayInSpan(
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): { month: number; day: number }[] {
  const days: { month: number; day: number }[] = [];
  let month = startMonth;
  let day = startDay;
  let guard = 0;

  while (guard < 366) {
    days.push({ month, day });
    if (month === endMonth && day === endDay) break;

    const d = new Date(2024, month - 1, day + 1);
    month = d.getMonth() + 1;
    day = d.getDate();
    guard += 1;
  }

  return days;
}

/** Prefer the configured anchor; skip Monday so waste pickup stays readable. */
function mascotAnchorInSpan(
  viewYear: number,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
  preferredMonth?: number,
  preferredDay?: number,
): { month: number; day: number } {
  const spanDays = eachDayInSpan(startMonth, startDay, endMonth, endDay);

  if (preferredMonth != null && preferredDay != null) {
    const prefIdx = spanDays.findIndex(
      (d) => d.month === preferredMonth && d.day === preferredDay,
    );
    if (prefIdx >= 0) {
      for (let i = prefIdx; i < spanDays.length; i++) {
        const { month, day } = spanDays[i];
        if (new Date(viewYear, month - 1, day).getDay() !== 1) {
          return { month, day };
        }
      }
    }
  }

  const startIdx = Math.max(
    0,
    spanDays.findIndex(
      (d) => d.month === startMonth && d.day === startDay,
    ),
  );

  for (let i = startIdx; i < spanDays.length; i++) {
    const { month, day } = spanDays[i];
    if (new Date(viewYear, month - 1, day).getDay() !== 1) {
      return { month, day };
    }
  }

  return spanDays[startIdx] ?? { month: startMonth, day: startDay };
}

function isThanksgivingEntry(
  m: CalendarHolidayMascotInput,
  label: string,
): boolean {
  const lower = `${label} ${m.label}`.toLowerCase();
  return lower.includes("thanksgiving") || lower.includes("turkey");
}

function isChristmasEveDaySpan(m: CalendarHolidayMascotInput): boolean {
  return (
    m.calendar_month === 12 &&
    m.calendar_day === 24 &&
    m.calendar_end_month === 12 &&
    m.calendar_end_day === 25
  );
}

function spanTint(
  label: string,
  m: CalendarHolidayMascotInput,
): TintClass {
  const lower = label.toLowerCase();
  if (lower.includes("hanukkah")) return TINT.hanukkah;
  if (lower.includes("pride")) return TINT.pride;
  if (lower.includes("thanksgiving")) return TINT.default;
  if (lower.includes("christmas") || isChristmasEveDaySpan(m)) {
    return TINT.christmas;
  }
  return TINT.default;
}

function resolveSpanBounds(
  m: CalendarHolidayMascotInput,
  endMonth: number,
  endDay: number,
  label: string,
): {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  isSpan: boolean;
} {
  if (isThanksgivingEntry(m, label)) {
    return {
      startMonth: m.start_month ?? m.calendar_month!,
      startDay: m.start_day ?? m.calendar_day!,
      endMonth: m.end_month ?? m.calendar_month!,
      endDay: m.end_day ?? m.calendar_day!,
      isSpan: true,
    };
  }

  const startMonth = m.calendar_month!;
  const startDay = m.calendar_day!;
  const spanEndMonth = endMonth;
  const spanEndDay = endDay;
  return {
    startMonth,
    startDay,
    endMonth: spanEndMonth,
    endDay: spanEndDay,
    isSpan: spanEndMonth !== startMonth || spanEndDay !== startDay,
  };
}

function resolveMascotAnchor(
  viewYear: number,
  m: CalendarHolidayMascotInput,
  span: ReturnType<typeof resolveSpanBounds>,
  label: string,
): { month: number; day: number } {
  if (isThanksgivingEntry(m, label)) {
    return mascotAnchorInSpan(
      viewYear,
      span.startMonth,
      span.startDay,
      span.endMonth,
      span.endDay,
      m.calendar_month!,
      m.calendar_day!,
    );
  }

  if (isChristmasEveDaySpan(m)) {
    return mascotAnchorInSpan(
      viewYear,
      span.startMonth,
      span.startDay,
      span.endMonth,
      span.endDay,
      12,
      25,
    );
  }

  return mascotAnchorInSpan(
    viewYear,
    span.startMonth,
    span.startDay,
    span.endMonth,
    span.endDay,
  );
}

export function buildCalendarHolidayLookup(
  mascots: CalendarHolidayMascotInput[],
  viewYear: number,
): Map<string, CalendarDayHoliday> {
  const map = new Map<string, CalendarDayHoliday>();
  const yearMascots = mascots.filter(
    (m) => m.year == null || m.year === viewYear,
  );

  function set(
    month: number,
    day: number,
    patch: Partial<CalendarDayHoliday>,
  ) {
    const key = dayKey(month, day);
    const prev = map.get(key) ?? {
      tintClass: null,
      label: null,
      mascotSrc: null,
      mascotAlt: null,
    };
    const next = { ...prev, ...patch };
    if (patch.mascotSrc && prev.mascotSrc) {
      next.mascotSrc = prev.mascotSrc;
      next.mascotAlt = prev.mascotAlt;
    }
    if (patch.label && prev.label && !patch.mascotSrc) {
      next.label = prev.label;
    }
    map.set(key, next);
  }

  for (const group of LINKED_HOLIDAYS) {
    for (const member of group.members) {
      set(member.month, member.day, {
        tintClass: group.tint,
        label: member.label,
      });
    }
  }

  for (const [key, { label, tint }] of Object.entries(TEXT_HOLIDAYS)) {
    const [m, d] = key.split("-").map(Number);
    set(m, d, { tintClass: tint, label });
  }

  for (const m of yearMascots) {
    if (m.calendar_month == null || m.calendar_day == null) continue;

    const existingLabel = map.get(
      dayKey(m.calendar_month, m.calendar_day),
    )?.label;
    const label =
      m.holiday_name ?? existingLabel ?? m.label.replace(/\s*quail$/i, "");
    const endMonth = m.calendar_end_month ?? m.calendar_month;
    const endDay = m.calendar_end_day ?? m.calendar_day;
    const span = resolveSpanBounds(m, endMonth!, endDay!, label);

    if (span.isSpan) {
      const tint = spanTint(label, m);
      const mascotAnchor = resolveMascotAnchor(viewYear, m, span, label);

      for (const { month, day } of eachDayInSpan(
        span.startMonth,
        span.startDay,
        span.endMonth,
        span.endDay,
      )) {
        const isMascotDay =
          month === mascotAnchor.month && day === mascotAnchor.day;

        if (isMascotDay) {
          set(month, day, {
            tintClass: tint,
            label,
            mascotSrc: m.src,
            mascotAlt: m.label,
          });
        } else {
          set(month, day, { tintClass: tint });
        }
      }
    } else {
      let tint: TintClass = TINT.default;
      if (m.calendar_month === 7 && m.calendar_day === 4) tint = TINT.patriotic;
      else if (m.calendar_month === 10 && m.calendar_day === 31)
        tint = TINT.default;
      else if (m.calendar_month === 12 && m.calendar_day === 25)
        tint = TINT.christmas;

      set(m.calendar_month, m.calendar_day, {
        tintClass: tint,
        label,
        mascotSrc: m.src,
        mascotAlt: m.label,
      });
    }
  }

  return map;
}

export function getCalendarDayHoliday(
  lookup: Map<string, CalendarDayHoliday>,
  year: number,
  month: number,
  day: number,
): CalendarDayHoliday | null {
  const key = dayKey(month, day);
  const base = lookup.get(key);
  const federal = getFederalPickupHolidayLabel(new Date(year, month - 1, day));

  if (!base && !federal) return null;

  if (base && base.label) return base;

  if (base && federal) {
    return {
      ...base,
      label: base.label ?? federal,
      tintClass: base.tintClass ?? TINT.federal,
    };
  }

  if (base) return base;

  return {
    tintClass: TINT.federal,
    label: federal,
    mascotSrc: null,
    mascotAlt: null,
  };
}
