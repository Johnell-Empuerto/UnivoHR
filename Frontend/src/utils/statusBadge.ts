// ── Context-sensitive status warning ──
// This utility provides default color mappings for common status values.
// Some modules use statuses with domain-specific meaning where the default
// color would be inappropriate. Those modules should continue using their
// own inline class overrides until explicitly migrated:
//
//   • Attendance statuses (PRESENT/LATE/ABSENT/LEAVE)
//   • Payroll statuses (PAID/UNPAID)
//   • Recruitment workflow/onboarding statuses
//   • Device sync log statuses (PROCESSED/FAILED/DUPLICATE)
//   • Anomaly severity/status (HIGH/MEDIUM/LOW/OPEN/REVIEWED/RESOLVED)
//   • HR Policy category badges
//   • Legal/docs informational badges
//
// When migrating a module, import and use the helpers here, but override
// the class string via getStatusBadgeClass(tone) when the default tone
// doesn't fit the domain meaning.

export type StatusBadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info"
  | "purple";

const toneClasses: Record<StatusBadgeTone, string> = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export const getStatusBadgeClass = (tone: StatusBadgeTone): string => {
  return toneClasses[tone];
};

const statusToneMap: Record<string, StatusBadgeTone> = {
  ACTIVE: "success",
  APPROVED: "success",
  COMPLETED: "success",
  PAID: "success",
  VERIFIED: "success",
  PRESENT: "success",
  REVIEWED: "success",
  PROCESSED: "success",
  REGULAR: "success",
  VALID: "success",
  ENABLED: "success",
  PASSED: "success",

  PENDING: "warning",
  IN_PROGRESS: "warning",
  DRAFT: "warning",
  PROBATIONARY: "warning",
  LATE: "warning",
  ON_HOLD: "warning",
  SUBMITTED: "warning",

  REJECTED: "danger",
  FAILED: "danger",
  ABSENT: "danger",
  UNPAID: "danger",
  RESIGNED: "danger",
  TERMINATED: "danger",
  CANCELLED: "danger",
  INVALID: "danger",
  DISABLED: "danger",

  INACTIVE: "neutral",
  ARCHIVED: "neutral",
  CLOSED: "neutral",

  SCHEDULED: "info",
  PUBLISHED: "info",
  LEAVE: "info",
  ON_LEAVE: "info",

  ADMIN: "purple",
};

export const getStatusTone = (status: string): StatusBadgeTone => {
  const normalized = status
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  return statusToneMap[normalized] || "neutral";
};

export const getStatusBadgeClassByStatus = (status: string): string => {
  const tone = getStatusTone(status);
  return getStatusBadgeClass(tone);
};

export const formatStatusLabel = (status: string): string => {
  if (!status) return "";

  return status
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
