// controllers/calendar.bulk.controller.js
const calendarBulkService = require("../services/calendar.bulk.service");
const { getUserBranchIds } = require("../utils/branchAccess");
const branchModel = require("../models/branch.model");
const fs = require("fs");
const path = require("path");

const bulkUpload = async (req, res) => {
  try {
    const { data, overwrite } = req.body;

    if (!data || data.length === 0) {
      return res.status(400).json({ message: "No data provided" });
    }

    // HR_ADMIN branch validation: every row must belong to an assigned branch
    if (req.user.role !== "ADMIN") {
      const assigned = await getUserBranchIds(req.user.id);
      const allBranches = await branchModel.getAll();
      const branchLookup = {};
      for (const b of allBranches) {
        branchLookup[b.name.toLowerCase()] = b;
        if (b.code) branchLookup[b.code.toLowerCase()] = b;
      }

      for (const row of data) {
        const branchValue = row.branch_value;
        if (branchValue) {
          const trimmed = branchValue.toString().trim();
          if (trimmed) {
            const key = trimmed.toLowerCase();
            const match = branchLookup[key];
            if (match) {
              if (!assigned.includes(match.id)) {
                return res.status(403).json({
                  message: "Bulk upload contains calendar entries for branches you are not allowed to manage.",
                });
              }
            }
          }
        }
      }
    }

    const results = await calendarBulkService.bulkUpsert(data, overwrite);

    res.json({
      message: "Bulk upload completed",
      summary: {
        totalRows: data.length,
        inserted: results.inserted,
        updated: results.updated,
        skipped: results.skipped,
        failed: results.failed,
      },
      errors: results.errors,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to process bulk upload",
    });
  }
};

// Download template
const downloadTemplate = async (req, res) => {
  try {
    const templateData = [
      {
        Date: "2024-01-01",
        Type: "REGULAR_HOLIDAY",
        Paid: true,
        Description: "New Year's Day (Global)",
      },
      {
        Date: "2024-01-15",
        Type: "SPECIAL_NON_WORKING",
        Paid: false,
        Description: "Special Non-Working Day",
        Branch: "Main Branch",
      },
      {
        Date: "2024-02-14",
        Type: "REGULAR",
        Paid: true,
        Description: "Regular Working Day",
      },
      {
        Date: "2024-04-09",
        Type: "REGULAR_HOLIDAY",
        Paid: true,
        Description: "Araw ng Kagitingan",
        Branch: "MAIN",
      },
      {
        Date: "2024-05-01",
        Type: "REGULAR_HOLIDAY",
        Paid: true,
        Description: "Labor Day",
      },
    ];

    const XLSX = require("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Calendar Template");

    // Add instructions sheet
    const instructions = [
      {
        Column: "Date",
        Format: "YYYY-MM-DD",
        Description: "Required. Date format: 2024-01-01",
        Example: "2024-12-25",
      },
      {
        Column: "Type",
        Format:
          "REGULAR | SPECIAL_NON_WORKING | REGULAR_HOLIDAY | SPECIAL_HOLIDAY",
        Description: "Required. Day type classification",
        Example: "REGULAR_HOLIDAY",
      },
      {
        Column: "Paid",
        Format: "true/false, yes/no, 1/0",
        Description: "Optional. Default: false",
        Example: "true",
      },
      {
        Column: "Description",
        Format: "Text",
        Description: "Optional. Max 500 characters",
        Example: "Christmas Day",
      },
      {
        Column: "Branch",
        Format: "Branch name or code",
        Description: "Optional. Leave empty for Global. Name/code (case-insensitive). Inactive/nonexistent branches rejected.",
        Example: "Main Branch, MAIN",
      },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="calendar_template.xlsx"',
    );
    res.send(buffer);
  } catch (error) {
    console.error("Template download error:", error);
    res.status(500).json({ message: "Failed to generate template" });
  }
};

module.exports = {
  bulkUpload,
  downloadTemplate,
};
