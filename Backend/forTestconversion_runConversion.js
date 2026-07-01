require("dotenv").config();
const logger = require("./utils/logger");

const {
  processYearEndLeaveConversion,
} = require("./services/leaveConversion.service");

(async () => {
  try {
    logger.info(" Running Year-End Conversion...");

    await processYearEndLeaveConversion(2025);

    logger.info(" Conversion completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, " Error:");
    process.exit(1);
  }
})();
