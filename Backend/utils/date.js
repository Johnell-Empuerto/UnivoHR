const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

// Convert timestamp to local date (YYYY-MM-DD) with optional timezone
const getLocalDate = (timestamp, timeZone = null) => {
  if (timeZone) {
    return dayjs(timestamp).tz(timeZone).format("YYYY-MM-DD");
  }
  return dayjs(timestamp).format("YYYY-MM-DD");
};

// Convert to Date object (safe)
const toDate = (timestamp) => {
  return dayjs(timestamp).toDate();
};

module.exports = {
  getLocalDate,
  toDate,
};
