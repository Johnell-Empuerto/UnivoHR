require("dotenv").config();

const {
  processYearEndLeaveConversion,
} = require("./services/leaveConversion.service");

(async () => {
  try {
    console.log("🔥 Running Year-End Conversion...");

    await processYearEndLeaveConversion(2025);

    console.log("✅ Conversion completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
})();
