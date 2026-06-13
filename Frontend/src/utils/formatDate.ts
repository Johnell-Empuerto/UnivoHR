// Operational timezone used throughout the organization
const OPERATIONAL_TZ = "Asia/Manila";

// ── Timezone abbreviation map ──
const TIMEZONE_ABBR: Record<string, string> = {
  "Asia/Manila": "PHT",
  "Asia/Tokyo": "JST",
  "Asia/Singapore": "SGT",
  "Asia/Shanghai": "CST",
  "Asia/Hong_Kong": "HKT",
  "Asia/Seoul": "KST",
  "Asia/Taipei": "CST",
  "Asia/Bangkok": "ICT",
  "Asia/Jakarta": "WIB",
  "Asia/Kolkata": "IST",
  "Asia/Dubai": "GST",
  "America/New_York": "EST",
  "America/Chicago": "CST",
  "America/Denver": "MST",
  "America/Los_Angeles": "PST",
  "Europe/London": "GMT",
  "Europe/Paris": "CET",
  "Australia/Sydney": "AEST",
  "Pacific/Auckland": "NZST",
};

export const getTimezoneAbbr = (timeZone?: string | null): string => {
  if (!timeZone) return "";
  return TIMEZONE_ABBR[timeZone] || timeZone;
};

// ── Timezone-safe variants (use for attendance/operational times) ──

// Extracts time portion always rendered in the operational timezone.
// Prevents browser timezone from shifting attendance clock times.
// "2026-06-06T00:00:00.000Z" → "8:00 AM"
export const formatTimeLocal = (dateStr: string, timeZone?: string): string => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timeZone || OPERATIONAL_TZ,
    });
  } catch {
    return dateStr;
  }
};

// Renders a date string in the operational timezone so a date-only
// value never shifts to the previous/next day due to browser tz.
// "2026-08-09"           → "Aug 09, 2026"
// "2026-08-08T16:00:00Z" → "Aug 09, 2026"  (UTC → Asia/Manila)
export const formatDateLocal = (dateStr: string, timeZone?: string): string => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      timeZone: timeZone || OPERATIONAL_TZ,
    });
  } catch {
    return dateStr;
  }
};

// Combination of formatDateLocal + formatTimeLocal.
export const formatDateTimeLocal = (dateStr: string, timeZone?: string): string => {
  if (!dateStr) return "-";
  return `${formatDateLocal(dateStr, timeZone)} ${formatTimeLocal(dateStr, timeZone)}`;
};

// ── Legacy helpers (browser-tz dependent, kept for backward compat) ──

export const formatDate = (date: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

export const formatTime = (date: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateTime = (date: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleString();
};

export const formatDateForInput = (date?: string) => {
  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

//  Better readable date (Jun 06, 2026)
export const formatDateShort = (date: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

//  Date range (Jun 06 – Jun 07, 2026)
export const formatDateRange = (from: string, to: string) => {
  if (!from || !to) return "-";

  const fromDate = new Date(from);
  const toDate = new Date(to);

  const sameYear = fromDate.getFullYear() === toDate.getFullYear();

  return `${fromDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })} – ${toDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    ...(sameYear && { year: "numeric" }),
  })}`;
};
