export const getFriendlyErrorMessage = (error: unknown): string => {
  const err = error as any;

  if (!err) return "An unexpected error occurred.";

  const message = err?.response?.data?.message || err?.message || "";
  const status = err?.response?.status;

  if (!message && !status) return "Cannot connect to the server. Please check if the backend is running.";

  const lower = message.toLowerCase();

  if (lower.includes("already has an active assignment") || lower.includes("already assigned")) {
    return "This employee is already assigned to this rotation group for the selected date.";
  }

  if (lower.includes("duplicate key") || lower.includes("unique constraint")) {
    return "This code or name already exists. Please use a different one.";
  }

  if (lower.includes("foreign key constraint")) {
    return "This record is still used by another setup and cannot be deleted.";
  }

  if (lower.includes("not found")) {
    return "The requested record was not found. It may have been already deleted.";
  }

  if (lower.includes("network error") || lower.includes("networkerror") || lower.includes("fetch failed")) {
    return "Cannot connect to the server. Please check if the backend is running.";
  }

  if (lower.includes("required")) {
    return "Please fill in all required fields.";
  }

  if (lower.includes("invalid")) {
    return "The data provided is invalid. Please check your entries and try again.";
  }

  if (status === 400) return "Invalid data. Please check your entries.";
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested record was not found.";
  if (status === 409) return "This record conflicts with an existing entry.";
  if (status >= 500) return "Server error. Please try again later or contact support.";

  if (message) return message;

  return "An unexpected error occurred. Please try again.";
};
