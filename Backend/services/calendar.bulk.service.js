const calendarModel = require("../models/calendar.model");
const branchModel = require("../models/branch.model");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

class CalendarBulkService {
  sanitizeString(str) {
    if (!str) return "";
    return str
      .toString()
      .replace(/[^\x20-\x7E]/g, "")
      .trim()
      .substring(0, 500);
  }

  validateDate(dateValue) {
    try {
      let date;
      if (typeof dateValue === "number") {
        const excelEpoch = new Date(1900, 0, 1);
        date = new Date(excelEpoch.getTime() + (dateValue - 2) * 86400000);
      } else {
        date = new Date(dateValue);
      }
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split("T")[0];
    } catch (error) {
      return null;
    }
  }

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

  validatePaidStatus(status) {
    if (typeof status === "boolean") return status;
    const statusStr = status?.toString().toLowerCase().trim();
    const paidMap = {
      yes: true, y: true, true: true, paid: true, 1: true,
      no: false, n: false, false: false, unpaid: false, 0: false,
    };
    return paidMap[statusStr] !== undefined ? paidMap[statusStr] : false;
  }

  resolveBranch(branchValue, branchLookup) {
    const trimmed = branchValue?.toString().trim();
    console.log("[BulkUpload] Branch Value:", JSON.stringify(branchValue));
    console.log("[BulkUpload] Trimmed:", JSON.stringify(trimmed));
    if (!trimmed) {
      console.log("[BulkUpload] Empty branch → GLOBAL");
      return { branch_id: null };
    }

    const key = trimmed.toLowerCase();
    console.log("[BulkUpload] Resolved Key:", key);
    const match = branchLookup[key];
    console.log("[BulkUpload] Match:", match);
    if (!match) {
      console.log("[BulkUpload] Branch not found → ERROR");
      return { error: `Branch "${trimmed}" does not exist in system.` };
    }
    if (!match.is_active) {
      console.log("[BulkUpload] Branch inactive → ERROR");
      return { error: `Branch "${trimmed}" is inactive.` };
    }
    console.log("[BulkUpload] Branch resolved → id:", match.id);
    return { branch_id: match.id };
  }

  processRow(row, rowIndex, branchLookup) {
    const errors = [];
    let date = null;
    let day_type = null;
    let is_paid = false;
    let description = "";
    let branch_id = null;

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
    const branchValue =
      row["Branch"] ||
      row["branch"] ||
      row["BRANCH"] ||
      row["Branch Name"] ||
      row["branch_name"];

    if (!dateValue) {
      errors.push(`Row ${rowIndex}: Date is required`);
    } else {
      date = this.validateDate(dateValue);
      if (!date) errors.push(`Row ${rowIndex}: Invalid date format`);
    }

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

    if (paidValue !== undefined) {
      is_paid = this.validatePaidStatus(paidValue);
    }

    if (descValue) {
      description = this.sanitizeString(descValue);
    }

    const branchResult = this.resolveBranch(branchValue, branchLookup);
    if (branchResult.error) {
      errors.push(`Row ${rowIndex}: ${branchResult.error}`);
    } else {
      branch_id = branchResult.branch_id;
    }

    return {
      valid: errors.length === 0,
      data: { date, day_type, is_paid, description, branch_id },
      errors,
    };
  }

  async parseFile(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) throw new Error("File is empty");
      if (data.length > 1000) throw new Error("Maximum 1000 rows allowed per upload");

      const allBranches = await branchModel.getAll();
      const branchLookup = {};
      for (const b of allBranches) {
        branchLookup[b.name.toLowerCase()] = b;
        if (b.code) branchLookup[b.code.toLowerCase()] = b;
      }

      const processedRows = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const result = this.processRow(data[i], i + 2, branchLookup);
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

  async bulkUpsert(calendarData, overwrite = true) {
    const results = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    const allBranches = await branchModel.getAll();
    const branchLookup = {};
    for (const b of allBranches) {
      branchLookup[b.name.toLowerCase()] = b;
      if (b.code) branchLookup[b.code.toLowerCase()] = b;
    }

    for (const item of calendarData) {
      try {
        let branchId = item.branch_id ?? null;

        if (item.branch_value) {
          const resolved = this.resolveBranch(item.branch_value, branchLookup);
          if (resolved.error) {
            results.failed++;
            results.errors.push(`Date ${item.date}: ${resolved.error}`);
            continue;
          }
          branchId = resolved.branch_id;
        }

        const existing = await calendarModel.getByDateAndBranch(item.date, branchId);

        if (existing) {
          if (overwrite) {
            await calendarModel.update(existing.id, {
              day_type: item.day_type,
              is_paid: item.is_paid,
              description: item.description,
              branch_id: branchId,
            });
            results.updated++;
          } else {
            results.skipped++;
            const label = branchId
              ? `date ${item.date} with branch_id ${branchId}`
              : `global date ${item.date}`;
            results.errors.push(
              `${label} already exists. Skipped (overwrite disabled)`,
            );
          }
        } else {
          const createData = {
            date: item.date,
            day_type: item.day_type,
            is_paid: item.is_paid,
            description: item.description,
            branch_id: branchId,
          };
          await calendarModel.create(createData);
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
