const dayjs = require("dayjs");

// Convert timestamp to local date (YYYY-MM-DD)
const getLocalDate = (timestamp) => {
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
