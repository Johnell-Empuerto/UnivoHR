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
