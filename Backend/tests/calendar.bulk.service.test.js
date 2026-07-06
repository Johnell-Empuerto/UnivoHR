jest.mock("../models/calendar.model", () => ({
  getByDateAndBranch: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../models/branch.model", () => ({
  getAll: jest.fn(),
}));

jest.mock("xlsx", () => ({
  readFile: jest.fn(),
  utils: { sheet_to_json: jest.fn() },
}));

jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));

jest.mock("fs");

const calendarModel = require("../models/calendar.model");
const branchModel = require("../models/branch.model");
const XLSX = require("xlsx");
const CalendarBulkService = require("../services/calendar.bulk.service");

describe("calendar.bulk.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sanitizeString", () => {
    it("strips non-ASCII and trims", () => {
      expect(CalendarBulkService.sanitizeString("  Hello World  ")).toBe("Hello World");
    });

    it("returns empty for falsy", () => {
      expect(CalendarBulkService.sanitizeString(null)).toBe("");
    });
  });

  describe("validateDate", () => {
    it("accepts Date object", () => {
      const result = CalendarBulkService.validateDate(new Date("2026-07-06"));
      expect(result).toBe("2026-07-06");
    });

    it("accepts YYYY-MM-DD string", () => {
      expect(CalendarBulkService.validateDate("2026-07-06")).toBe("2026-07-06");
    });

    it("accepts YYYY/MM/DD string", () => {
      expect(CalendarBulkService.validateDate("2026/07/06")).toBe("2026-07-06");
    });

    it("accepts MM/DD/YYYY string", () => {
      expect(CalendarBulkService.validateDate("07/06/2026")).toBe("2026-07-06");
    });

    it("accepts Excel serial number", () => {
      const excelEpoch = new Date(1900, 0, 1);
      const expectedDate = new Date(excelEpoch.getTime() + (46212 - 2) * 86400000);
      const expectedStr = `${expectedDate.getFullYear()}-${String(expectedDate.getMonth() + 1).padStart(2, "0")}-${String(expectedDate.getDate()).padStart(2, "0")}`;
      expect(CalendarBulkService.validateDate(46212)).toBe(expectedStr);
    });

    it("returns null for invalid date", () => {
      expect(CalendarBulkService.validateDate("not-a-date")).toBeNull();
    });

    it("returns null for undefined", () => {
      expect(CalendarBulkService.validateDate(undefined)).toBeNull();
    });
  });

  describe("validateDayType", () => {
    it("accepts full type names", () => {
      expect(CalendarBulkService.validateDayType("REGULAR")).toBe("REGULAR");
      expect(CalendarBulkService.validateDayType("REGULAR_HOLIDAY")).toBe("REGULAR_HOLIDAY");
      expect(CalendarBulkService.validateDayType("SPECIAL_NON_WORKING")).toBe("SPECIAL_NON_WORKING");
      expect(CalendarBulkService.validateDayType("SPECIAL_HOLIDAY")).toBe("SPECIAL_HOLIDAY");
    });

    it("accepts abbreviations", () => {
      expect(CalendarBulkService.validateDayType("RD")).toBe("REGULAR");
      expect(CalendarBulkService.validateDayType("RH")).toBe("REGULAR_HOLIDAY");
      expect(CalendarBulkService.validateDayType("SNW")).toBe("SPECIAL_NON_WORKING");
      expect(CalendarBulkService.validateDayType("SH")).toBe("SPECIAL_HOLIDAY");
    });

    it("accepts display names with spaces", () => {
      expect(CalendarBulkService.validateDayType("Regular Day")).toBe("REGULAR");
      expect(CalendarBulkService.validateDayType("Special Non-Working")).toBe("SPECIAL_NON_WORKING");
    });

    it("returns null for invalid type", () => {
      expect(CalendarBulkService.validateDayType("INVALID")).toBeNull();
    });

    it("returns null for falsy input", () => {
      expect(CalendarBulkService.validateDayType(null)).toBeNull();
    });
  });

  describe("validatePaidStatus", () => {
    it("accepts boolean true/false", () => {
      expect(CalendarBulkService.validatePaidStatus(true)).toBe(true);
      expect(CalendarBulkService.validatePaidStatus(false)).toBe(false);
    });

    it("accepts yes/no strings", () => {
      expect(CalendarBulkService.validatePaidStatus("yes")).toBe(true);
      expect(CalendarBulkService.validatePaidStatus("no")).toBe(false);
    });

    it("accepts y/n shorthand", () => {
      expect(CalendarBulkService.validatePaidStatus("y")).toBe(true);
      expect(CalendarBulkService.validatePaidStatus("n")).toBe(false);
    });

    it("defaults to false for unknown", () => {
      expect(CalendarBulkService.validatePaidStatus("maybe")).toBe(false);
    });
  });

  describe("resolveBranch", () => {
    const branchLookup = {
      "main": { id: 1, name: "Main", is_active: true, code: "M01" },
      "m01": { id: 1, name: "Main", is_active: true, code: "M01" },
      "inactive": { id: 2, name: "Inactive", is_active: false },
    };

    it("resolves by name", () => {
      expect(CalendarBulkService.resolveBranch("Main", branchLookup)).toEqual({ branch_id: 1 });
    });

    it("resolves by code", () => {
      expect(CalendarBulkService.resolveBranch("M01", branchLookup)).toEqual({ branch_id: 1 });
    });

    it("returns null branch_id for empty value (GLOBAL)", () => {
      expect(CalendarBulkService.resolveBranch("", branchLookup)).toEqual({ branch_id: null });
    });

    it("returns error for unknown branch", () => {
      const result = CalendarBulkService.resolveBranch("Unknown", branchLookup);
      expect(result.error).toContain("does not exist");
    });

    it("returns error for inactive branch", () => {
      const result = CalendarBulkService.resolveBranch("Inactive", branchLookup);
      expect(result.error).toContain("inactive");
    });
  });

  describe("processRow", () => {
    const branchLookup = { "main": { id: 1, name: "Main", is_active: true } };

    it("processes a valid row", () => {
      const result = CalendarBulkService.processRow(
        { Date: "2026-07-06", Type: "Regular Holiday", Paid: "yes", Description: "Test" },
        2,
        branchLookup,
      );

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        date: "2026-07-06",
        day_type: "REGULAR_HOLIDAY",
        is_paid: true,
        description: "Test",
        branch_id: null,
      });
    });

    it("collects errors for invalid row", () => {
      const result = CalendarBulkService.processRow({}, 2, {});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("handles missing date", () => {
      const result = CalendarBulkService.processRow(
        { Type: "Regular" },
        2,
        branchLookup,
      );

      expect(result.errors.some(e => e.includes("Date is required"))).toBe(true);
    });
  });

  describe("bulkUpsert", () => {
    it("inserts new entries", async () => {
      branchModel.getAll.mockResolvedValue([{ id: 1, name: "Main", is_active: true, code: "M01" }]);
      calendarModel.getByDateAndBranch.mockResolvedValue(null);
      calendarModel.create.mockResolvedValue({ id: 1 });

      const result = await CalendarBulkService.bulkUpsert([
        { date: "2026-07-06", day_type: "REGULAR_HOLIDAY", is_paid: true, branch_id: null },
      ]);

      expect(result.inserted).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it("updates existing entries when overwrite=true", async () => {
      branchModel.getAll.mockResolvedValue([]);
      calendarModel.getByDateAndBranch.mockResolvedValue({ id: 1 });
      calendarModel.update.mockResolvedValue({ id: 1 });

      const result = await CalendarBulkService.bulkUpsert([
        { date: "2026-07-06", day_type: "REGULAR_HOLIDAY", is_paid: true, branch_id: null },
      ], true);

      expect(result.updated).toBe(1);
    });

    it("skips existing entries when overwrite=false", async () => {
      branchModel.getAll.mockResolvedValue([]);
      calendarModel.getByDateAndBranch.mockResolvedValue({ id: 1 });

      const result = await CalendarBulkService.bulkUpsert([
        { date: "2026-07-06", day_type: "REGULAR_HOLIDAY", is_paid: true, branch_id: null },
      ], false);

      expect(result.skipped).toBe(1);
    });
  });
});
