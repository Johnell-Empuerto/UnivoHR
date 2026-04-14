// services/calendar.bulk.service.js
const calendarModel = require("../models/calendar.model");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

class CalendarBulkService {
  // Sanitize input to prevent injection
  sanitizeString(str) {
    if (!str) return "";
    // Remove any non-printable characters
    return str
      .toString()
      .replace(/[^\x20-\x7E]/g, "")
      .trim()
      .substring(0, 500); // Limit length
  }

  // Validate and normalize date
  validateDate(dateValue) {
    try {
      let date;

      // Handle Excel serial number
      if (typeof dateValue === "number") {
        const excelEpoch = new Date(1900, 0, 1);
        date = new Date(excelEpoch.getTime() + (dateValue - 2) * 86400000);
      } else {
        date = new Date(dateValue);
      }

      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      // Format as YYYY-MM-DD
      return date.toISOString().split("T")[0];
    } catch (error) {
      return null;
    }
  }

  // Validate day type
  validateDayType(type) {
    const validTypes = [
      "REGULAR",
      "SPECIAL_NON_WORKING",
      "REGULAR_HOLIDAY",
      "SPECIAL_HOLIDAY",
    ];

    const normalizedType = type
      ?.toString()
      .toUpperCase()
      .trim()
      .replace(/_/g, " ");

    // Map common variations
    const typeMap = {
      REGULAR: "REGULAR",
      RD: "REGULAR",
      "REGULAR DAY": "REGULAR",

      "SPECIAL NON-WORKING": "SPECIAL_NON_WORKING",
      "SPECIAL NON WORKING": "SPECIAL_NON_WORKING",
      SNW: "SPECIAL_NON_WORKING",

      "REGULAR HOLIDAY": "REGULAR_HOLIDAY",
      RH: "REGULAR_HOLIDAY",

      "SPECIAL HOLIDAY": "SPECIAL_HOLIDAY",
      SH: "SPECIAL_HOLIDAY",
    };

    const mappedType = typeMap[normalizedType];
    return validTypes.includes(mappedType) ? mappedType : null;
  }

  // Validate paid status
  validatePaidStatus(status) {
    if (typeof status === "boolean") return status;

    const statusStr = status?.toString().toLowerCase().trim();
    const paidMap = {
      yes: true,
      y: true,
      true: true,
      paid: true,
      1: true,
      no: false,
      n: false,
      false: false,
      unpaid: false,
      0: false,
    };

    return paidMap[statusStr] !== undefined ? paidMap[statusStr] : false;
  }

  // Process and validate a single row
  processRow(row, rowIndex) {
    const errors = [];
    let date = null;
    let day_type = null;
    let is_paid = false;
    let description = "";

    // Get values from different column name variations
    const dateValue =
      row["Date"] || row["date"] || row["DATE"] || row["Day"] || row["day"];
    const typeValue =
      row["Type"] ||
      row["type"] ||
      row["Day Type"] ||
      row["day_type"] ||
      row["DAY_TYPE"];
    const paidValue =
      row["Paid"] ||
      row["paid"] ||
      row["Is Paid"] ||
      row["is_paid"] ||
      row["PAID"];
    const descValue =
      row["Description"] || row["description"] || row["Notes"] || row["notes"];

    // Validate date
    if (!dateValue) {
      errors.push(`Row ${rowIndex}: Date is required`);
    } else {
      date = this.validateDate(dateValue);
      if (!date) {
        errors.push(`Row ${rowIndex}: Invalid date format`);
      }
    }

    // Validate day type
    if (!typeValue) {
      errors.push(`Row ${rowIndex}: Day type is required`);
    } else {
      day_type = this.validateDayType(typeValue);
      if (!day_type) {
        errors.push(
          `Row ${rowIndex}: Invalid day type. Must be: Regular, Special Non-Working, Regular Holiday, Special Holiday`,
        );
      }
    }

    // Validate paid status (optional)
    if (paidValue !== undefined) {
      is_paid = this.validatePaidStatus(paidValue);
    }

    // Sanitize description
    if (descValue) {
      description = this.sanitizeString(descValue);
    }

    return {
      valid: errors.length === 0,
      data: { date, day_type, is_paid, description },
      errors,
    };
  }

  // Parse Excel/CSV file
  async parseFile(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        throw new Error("File is empty");
      }

      if (data.length > 1000) {
        throw new Error("Maximum 1000 rows allowed per upload");
      }

      const processedRows = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const result = this.processRow(data[i], i + 2); // +2 for header row
        if (result.valid) {
          processedRows.push(result.data);
        } else {
          errors.push(...result.errors);
        }
      }

      return { data: processedRows, errors };
    } catch (error) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  // Bulk upsert (update if exists, insert if not)
  async bulkUpsert(calendarData, overwrite = true) {
    const results = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (const item of calendarData) {
      try {
        // Check if date exists
        const existing = await calendarModel.getByDate(item.date);

        if (existing) {
          if (overwrite) {
            // Update existing record
            await calendarModel.update(existing.id, {
              day_type: item.day_type,
              is_paid: item.is_paid,
              description: item.description,
            });
            results.updated++;
          } else {
            // Skip if exists and not overwriting
            results.failed++;
            results.errors.push(
              `Date ${item.date} already exists. Skipped (overwrite disabled)`,
            );
          }
        } else {
          // Insert new record
          await calendarModel.create(item);
          results.inserted++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to process date ${item.date}: ${error.message}`,
        );
      }
    }

    return results;
  }
}

module.exports = new CalendarBulkService();
