jest.mock("exceljs", () => ({ Workbook: jest.fn() }));

jest.mock("xlsx", () => ({
  readFile: jest.fn(),
  utils: { sheet_to_json: jest.fn() },
}));

jest.mock("fs");

jest.mock("../config/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock("../models/branch.model", () => ({
  getActive: jest.fn(),
  getAll: jest.fn(),
}));

jest.mock("../models/leaveCredit.model", () => ({
  createDefault: jest.fn(),
}));

jest.mock("bcrypt", () => ({ hash: jest.fn() }));

jest.mock("../services/audit.service", () => ({ auditLog: jest.fn() }));

jest.mock("../services/applicant.service", () => ({
  getEmployeeCodeSettings: jest.fn(),
}));

jest.mock("../models/user.model", () => ({}));

jest.mock("../models/permission.model", () => ({
  setUserPermissions: jest.fn(),
}));

jest.mock("../constants/permissions", () => ({
  EMPLOYEE_DEFAULT_PERMISSIONS: [],
}));

jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const ExcelJS = require("exceljs");
const XLSX = require("xlsx");
const pool = require("../config/db");
const branchModel = require("../models/branch.model");
const leaveCreditModel = require("../models/leaveCredit.model");
const bcrypt = require("bcrypt");
const audit = require("../services/audit.service");
const { getEmployeeCodeSettings } = require("../services/applicant.service");
const permissionModel = require("../models/permission.model");
const logger = require("../utils/logger");
const service = require("../services/employeeBulk.service");

const mockBranches = [
  { id: 1, name: "Main Branch", code: "MAIN", is_active: true },
  { id: 2, name: "Inactive Branch", code: "INACT", is_active: false },
];

const mockSettings = { autoGenerate: "true", prefix: "EMP", separator: "-", padding: "4", counter: "5" };
const mockSettingsNoAuto = { ...mockSettings, autoGenerate: "false" };

const validRowData = {
  "Employee Code": "EMP-001",
  "First Name": "Juan",
  "Middle Name": "D.",
  "Last Name": "Dela Cruz",
  "Suffix": "Jr.",
  "Email": "juan@company.com",
  "Phone": "09171234567",
  "Gender": "Male",
  "Birth Date": "1990-01-15",
  "Hire Date": "2026-01-15",
  "Branch": "Main Branch",
  "Department": "IT",
  "Position": "Developer",
  "Employment Status": "Probationary",
  "Employee Status": "ACTIVE",
  "Basic Salary": 50000,
  "Address": "123 Rizal St.",
  "SSS Number": "12-3456789-0",
  "PhilHealth Number": "12-345678901-2",
  "Pag-IBIG Number": "1234-5678-9012",
  "TIN Number": "123-456-789-000",
  "Emergency Contact Name": "Maria",
  "Emergency Contact Number": "09179876543",
  "Emergency Contact Address": "456 Mabini St.",
  "Emergency Contact Relation": "Mother",
  "Username": "",
  "Password": "",
  "Role": "",
};

const setupXLSX = (rows) => {
  XLSX.readFile.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } });
  XLSX.utils.sheet_to_json.mockReturnValue(rows);
};

const setupParsePool = ({ existingCodes = [], existingEmails = [], batchId = 100 } = {}) => {
  pool.query
    .mockReset()
    .mockResolvedValueOnce({ rows: existingCodes.map((c) => ({ employee_code: c })) })
    .mockResolvedValueOnce({ rows: existingEmails.map((e) => ({ email: e })) })
    .mockResolvedValue({ rows: [{ id: batchId }] });
};

describe("employeeBulk.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  // generateTemplate
  // ──────────────────────────────────────────────
  describe("generateTemplate", () => {
    it("returns a workbook with Template and Instructions sheets", async () => {
      branchModel.getActive.mockResolvedValue(mockBranches);

      const wsTemplate = { columns: null, getRow: jest.fn(), addRow: jest.fn(), getCell: jest.fn(), getColumn: jest.fn() };
      const wsInstructions = { columns: null, addRow: jest.fn(), getRow: jest.fn(), getColumn: jest.fn() };
      const mockWorkbook = { addWorksheet: jest.fn().mockReturnValueOnce(wsTemplate).mockReturnValueOnce(wsInstructions) };
      ExcelJS.Workbook.mockImplementation(() => mockWorkbook);

      const mockRow = { eachCell: jest.fn((cb) => cb({ font: {}, fill: {}, alignment: {}, border: {} })), getCell: jest.fn() };
      wsTemplate.getRow.mockReturnValue(mockRow);
      wsTemplate.addRow.mockReturnValue(mockRow);
      wsTemplate.getCell.mockReturnValue({ dataValidation: null });
      wsTemplate.getColumn.mockReturnValue({ hidden: false });
      wsInstructions.addRow.mockReturnValue({ eachCell: jest.fn() });
      wsInstructions.getRow.mockReturnValue({ eachCell: jest.fn() });
      wsInstructions.getColumn.mockReturnValue({});

      const result = await service.generateTemplate();

      expect(ExcelJS.Workbook).toHaveBeenCalledTimes(1);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith("Template", expect.objectContaining({ views: expect.any(Array) }));
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith("Instructions");
      expect(result).toBe(mockWorkbook);
      expect(branchModel.getActive).toHaveBeenCalled();
    });

    it("handles no active branches gracefully", async () => {
      branchModel.getActive.mockResolvedValue([]);

      const wsTemplate = { columns: null, getRow: jest.fn(), addRow: jest.fn(), getCell: jest.fn(), getColumn: jest.fn() };
      const wsInstructions = { columns: null, addRow: jest.fn(), getRow: jest.fn(), getColumn: jest.fn() };
      const mockWorkbook = { addWorksheet: jest.fn().mockReturnValueOnce(wsTemplate).mockReturnValueOnce(wsInstructions) };
      ExcelJS.Workbook.mockImplementation(() => mockWorkbook);

      const mockRow = { eachCell: jest.fn((cb) => cb({ font: {}, fill: {}, alignment: {}, border: {} })), getCell: jest.fn() };
      wsTemplate.getRow.mockReturnValue(mockRow);
      wsTemplate.addRow.mockReturnValue(mockRow);
      wsTemplate.getCell.mockReturnValue({ dataValidation: null });
      wsTemplate.getColumn.mockReturnValue({ hidden: false });
      wsInstructions.addRow.mockReturnValue({ eachCell: jest.fn() });
      wsInstructions.getRow.mockReturnValue({ eachCell: jest.fn() });
      wsInstructions.getColumn.mockReturnValue({});

      const result = await service.generateTemplate();
      expect(result).toBe(mockWorkbook);
    });
  });

  // ──────────────────────────────────────────────
  // parseAndValidate
  // ──────────────────────────────────────────────
  describe("parseAndValidate", () => {
    it("throws if file has no data rows", async () => {
      setupXLSX([]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);

      await expect(service.parseAndValidate("/tmp/file.xlsx", 1)).rejects.toThrow("File is empty or has no data rows");
    });

    it("throws if file exceeds max rows", async () => {
      const manyRows = Array(10001).fill({ "First Name": "A" });
      setupXLSX(manyRows);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);

      await expect(service.parseAndValidate("/tmp/file.xlsx", 1)).rejects.toThrow("Maximum 10000 rows allowed");
    });

    it("validates a single valid row and returns batch result", async () => {
      setupXLSX([validRowData]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 123);

      expect(result.batchId).toBe(100);
      expect(result.summary).toEqual({ totalRows: 1, validRows: 1, invalidRows: 0, duplicateRows: 0 });
      expect(result.previewRows).toHaveLength(1);
      expect(result.previewRows[0].status).toBe("valid");
      expect(result.errors).toHaveLength(0);
    });

    it("reports missing required fields", async () => {
      setupXLSX([{ "Hire Date": "2026-01-15", "Branch": "Main Branch" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.summary.validRows).toBe(0);
      expect(result.summary.invalidRows).toBe(1);
      expect(result.previewRows[0].status).toBe("invalid");
      const errors = result.previewRows[0].errors;
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("First Name is required"),
          expect.stringContaining("Last Name is required"),
        ])
      );
    });

    it("rejects invalid email format", async () => {
      setupXLSX([{ ...validRowData, "Email": "not-an-email" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].status).toBe("invalid");
      expect(result.previewRows[0].errors).toEqual(expect.arrayContaining([expect.stringContaining("Invalid Email format")]));
    });

    it("rejects invalid gender", async () => {
      setupXLSX([{ ...validRowData, "Gender": "Alien" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].status).toBe("invalid");
      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Invalid Gender "Alien"')])
      );
    });

    it("rejects invalid employment status", async () => {
      setupXLSX([{ ...validRowData, "Employment Status": "Contractor" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Invalid Employment Status "Contractor"')])
      );
    });

    it("rejects invalid employee status", async () => {
      setupXLSX([{ ...validRowData, "Employee Status": "FIRED" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Invalid Employee Status "FIRED"')])
      );
    });

    it("rejects invalid hire date format", async () => {
      setupXLSX([{ ...validRowData, "Hire Date": "not-a-date" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].status).toBe("invalid");
      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Invalid Hire Date format")])
      );
    });

    it("rejects future hire date", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);
      const dateStr = futureDate.toISOString().split("T")[0];
      setupXLSX([{ ...validRowData, "Hire Date": dateStr }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Hire Date cannot be a future date")])
      );
    });

    it("rejects invalid birth date format", async () => {
      setupXLSX([{ ...validRowData, "Birth Date": "invalid-date" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Invalid Birth Date format")])
      );
    });

    it("rejects negative basic salary", async () => {
      setupXLSX([{ ...validRowData, "Basic Salary": -100 }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Basic Salary must be a valid positive number")])
      );
    });

    it("rejects non-numeric basic salary", async () => {
      setupXLSX([{ ...validRowData, "Basic Salary": "abc" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Basic Salary must be a valid positive number")])
      );
    });

    it("detects duplicate employee code in file", async () => {
      const row2 = { ...validRowData, "Employee Code": "EMP-001", "First Name": "Jane", "Last Name": "Smith", "Email": "jane@company.com" };
      setupXLSX([validRowData, row2]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.summary.duplicateRows).toBeGreaterThanOrEqual(1);
      expect(result.previewRows[1].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Duplicate Employee Code")])
      );
    });

    it("detects duplicate employee code in system", async () => {
      setupXLSX([validRowData]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool({ existingCodes: ["EMP-001"] });

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("already exists in the system")])
      );
    });

    it("detects duplicate email in file", async () => {
      const row2 = { ...validRowData, "Employee Code": "EMP-002", "First Name": "Jane", "Email": "juan@company.com" };
      setupXLSX([validRowData, row2]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[1].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Duplicate Email")])
      );
    });

    it("detects duplicate email in system", async () => {
      setupXLSX([validRowData]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool({ existingEmails: ["juan@company.com"] });

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("already exists in the system")])
      );
    });

    it("requires employee code when auto-generation is disabled", async () => {
      setupXLSX([{ ...validRowData, "Employee Code": "" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettingsNoAuto);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Employee Code is required because auto-generation is disabled")])
      );
    });

    it("validates account creation: password required when username provided", async () => {
      setupXLSX([{ ...validRowData, "Username": "juan", "Password": "", "Role": "" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Password is required when Username is provided")])
      );
    });

    it("validates account creation: password must be at least 4 characters", async () => {
      setupXLSX([{ ...validRowData, "Username": "juan", "Password": "ab", "Role": "" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Password must be at least 4 characters")])
      );
    });

    it("validates account creation: invalid role", async () => {
      setupXLSX([{ ...validRowData, "Username": "juan", "Password": "pass1234", "Role": "SUPERADMIN" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Invalid Role "SUPERADMIN"')])
      );
    });

    it("validates account creation: existing username", async () => {
      setupXLSX([{ ...validRowData, "Username": "juan", "Password": "pass1234", "Role": "EMPLOYEE" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);

      pool.query
        .mockReset()
        .mockResolvedValueOnce({ rows: [] }) // existing codes
        .mockResolvedValueOnce({ rows: [] }) // existing emails
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // username EXISTS
        .mockResolvedValue({ rows: [{ id: 100 }] }); // batch insert + rest

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Username "juan" already exists')])
      );
    });

    it("rejects unknown branch", async () => {
      setupXLSX([{ ...validRowData, "Branch": "Unknown Branch" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Branch "Unknown Branch" was not found')])
      );
    });

    it("rejects inactive branch", async () => {
      setupXLSX([{ ...validRowData, "Branch": "Inactive Branch" }]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.previewRows[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining("inactive")])
      );
    });

    it("handles dates in various formats", async () => {
      const dateVariants = [
        { ...validRowData, "Employee Code": "EMP-D1", "Email": "d1@c.com", "Hire Date": "01/15/2026" },
        { ...validRowData, "Employee Code": "EMP-D2", "Email": "d2@c.com", "Hire Date": "2026/03/20" },
        { ...validRowData, "Employee Code": "EMP-D3", "Email": "d3@c.com", "Hire Date": new Date("2026-07-04") },
        { ...validRowData, "Employee Code": "EMP-D4", "Email": "d4@c.com", "Hire Date": "January 15, 2026" },
      ];
      setupXLSX(dateVariants);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.summary.validRows).toBe(4);
      result.previewRows.forEach((r) => expect(r.status).toBe("valid"));
    });

    it("handles a mix of valid and invalid rows", async () => {
      const row1 = { ...validRowData, "Employee Code": "EMP-V1", "Email": "v1@c.com" };
      const row2 = { "First Name": "", "Last Name": "", "Hire Date": "", "Branch": "" };
      setupXLSX([row1, row2]);
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);
      branchModel.getAll.mockResolvedValue(mockBranches);
      setupParsePool();

      const result = await service.parseAndValidate("/tmp/file.xlsx", 1);

      expect(result.summary.totalRows).toBe(2);
      expect(result.summary.validRows).toBe(1);
      expect(result.summary.invalidRows).toBe(1);
      expect(result.previewRows[0].status).toBe("valid");
      expect(result.previewRows[1].status).toBe("invalid");
    });
  });

  // ──────────────────────────────────────────────
  // commitImport
  // ──────────────────────────────────────────────
  describe("commitImport", () => {
    const mockBatch = { id: 100, status: "validated", invalid_rows: 0, total_rows: 1, valid_rows: 1 };
    const mockValidRow = {
      id: 1,
      row_number: 2,
      status: "valid",
      normalized_data: {
        employee_code: "EMP-001",
        first_name: "Juan",
        middle_name: null,
        last_name: "Dela Cruz",
        suffix: null,
        email: "juan@company.com",
        contact_number: null,
        gender: "MALE",
        birthday: null,
        hired_date: "2026-01-15",
        branch_id: 1,
        branch_name: "Main Branch",
        department: "IT",
        position: "Developer",
        employment_status: "REGULAR",
        status: "ACTIVE",
        basic_salary: 50000,
        address: null,
        sss_number: null,
        philhealth_number: null,
        hdmf_number: null,
        tin_number: null,
        emergency_contact_name: null,
        emergency_contact_number: null,
        emergency_contact_address: null,
        emergency_contact_relation: null,
        account: null,
      },
    };

    const createClient = () => ({
      query: jest.fn(),
      release: jest.fn(),
    });

    it("successfully imports valid rows", async () => {
      pool.query
        .mockReset()
        .mockResolvedValueOnce({ rows: [mockBatch] }) // get batch
        .mockResolvedValueOnce({ rows: [mockValidRow] }) // get valid rows
        .mockResolvedValueOnce() // update to 'importing'
        .mockResolvedValue({ rows: [] }); // remaining (completed update, counter, etc.)

      const client = createClient();
      pool.connect.mockResolvedValue(client);

      client.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // employee code check
        .mockResolvedValueOnce({ rows: [] }) // email check
        .mockResolvedValueOnce({ rows: [{ id: 42 }] }) // INSERT employee RETURNING id
        .mockResolvedValueOnce() // INSERT salary
        .mockResolvedValueOnce() // UPDATE employee_import_rows
        .mockResolvedValueOnce(); // COMMIT

      leaveCreditModel.createDefault.mockResolvedValue();
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);

      const req = { ip: "127.0.0.1", headers: {} };
      const result = await service.commitImport(100, 1, req);

      expect(result.importedCount).toBe(1);
      expect(result.accountsCreated).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(client.query).toHaveBeenCalledWith("BEGIN");
      expect(client.query).toHaveBeenCalledWith("COMMIT");
      expect(leaveCreditModel.createDefault).toHaveBeenCalledWith(42, client);
    });

    it("throws if batch is not found", async () => {
      pool.query.mockReset().mockResolvedValueOnce({ rows: [] });

      await expect(service.commitImport(999, 1, {})).rejects.toThrow("Batch 999 not found");
    });

    it("throws if batch status is not validated", async () => {
      pool.query.mockReset().mockResolvedValueOnce({ rows: [{ id: 100, status: "completed" }] });

      await expect(service.commitImport(100, 1, {})).rejects.toThrow(
        'Batch 100 is in status "completed". Only validated batches can be committed.'
      );
    });

    it("throws if there are no valid rows", async () => {
      pool.query
        .mockReset()
        .mockResolvedValueOnce({ rows: [mockBatch] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(service.commitImport(100, 1, {})).rejects.toThrow("No valid rows to import");
    });

    it("rolls back transaction and marks batch as failed on error", async () => {
      pool.query
        .mockReset()
        .mockResolvedValueOnce({ rows: [mockBatch] }) // get batch
        .mockResolvedValueOnce({ rows: [mockValidRow] }) // get valid rows
        .mockResolvedValueOnce() // update to 'importing'
        .mockResolvedValue({ rows: [] }); // for failed update

      const client = createClient();
      pool.connect.mockResolvedValue(client);

      client.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 99 }] }); // employee code ALREADY EXISTS

      const req = { ip: "127.0.0.1", headers: {} };

      await expect(service.commitImport(100, 1, req)).rejects.toThrow("already exists at commit time");

      expect(client.query).toHaveBeenCalledWith("ROLLBACK");
      expect(client.release).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE employee_import_batches"),
        expect.any(Array)
      );
    });

    it("creates user account and sets default permissions for non-admin role", async () => {
      const rowWithAccount = {
        ...mockValidRow,
        normalized_data: {
          ...mockValidRow.normalized_data,
          employee_code: "EMP-002",
          account: { username: "juan", password: "secret123", role: "EMPLOYEE" },
        },
      };

      pool.query
        .mockReset()
        .mockResolvedValueOnce({ rows: [mockBatch] })
        .mockResolvedValueOnce({ rows: [rowWithAccount] })
        .mockResolvedValueOnce() // importing
        .mockResolvedValue({ rows: [] });

      const client = createClient();
      pool.connect.mockResolvedValue(client);

      bcrypt.hash.mockResolvedValue("hashed_password");

      client.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // employee code check
        .mockResolvedValueOnce({ rows: [] }) // email check
        .mockResolvedValueOnce({ rows: [{ id: 50 }] }) // INSERT employee
        .mockResolvedValueOnce() // INSERT salary
        .mockResolvedValueOnce({ rows: [] }) // user check
        .mockResolvedValueOnce({ rows: [{ id: 10, username: "juan", role: "EMPLOYEE", employee_id: 50 }] }) // INSERT user
        .mockResolvedValueOnce() // UPDATE row
        .mockResolvedValueOnce(); // COMMIT

      leaveCreditModel.createDefault.mockResolvedValue();
      getEmployeeCodeSettings.mockResolvedValue({ ...mockSettings, autoGenerate: "false" });

      const req = { ip: "127.0.0.1", headers: {} };
      const result = await service.commitImport(100, 1, req);

      expect(result.importedCount).toBe(1);
      expect(result.accountsCreated).toBe(1);
      expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 10);
      expect(permissionModel.setUserPermissions).toHaveBeenCalledWith(10, []);
    });

    it("correctly computes regularization_date for PROBATIONARY employees", async () => {
      const probationaryRow = {
        ...mockValidRow,
        normalized_data: {
          ...mockValidRow.normalized_data,
          employee_code: "EMP-003",
          employment_status: "PROBATIONARY",
          hired_date: "2026-01-15",
        },
      };

      pool.query
        .mockReset()
        .mockResolvedValueOnce({ rows: [mockBatch] })
        .mockResolvedValueOnce({ rows: [probationaryRow] })
        .mockResolvedValueOnce() // importing
        .mockResolvedValue({ rows: [] });

      const client = createClient();
      pool.connect.mockResolvedValue(client);

      client.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // employee code check
        .mockResolvedValueOnce({ rows: [] }) // email check
        .mockResolvedValueOnce({ rows: [{ id: 60 }] }) // INSERT employee
        .mockResolvedValueOnce() // INSERT salary
        .mockResolvedValueOnce() // UPDATE row
        .mockResolvedValueOnce(); // COMMIT

      leaveCreditModel.createDefault.mockResolvedValue();
      getEmployeeCodeSettings.mockResolvedValue(mockSettings);

      const req = { ip: "127.0.0.1", headers: {} };
      const result = await service.commitImport(100, 1, req);

      expect(result.importedCount).toBe(1);

      const insertCall = client.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO employees"));
      expect(insertCall).toBeDefined();
      const values = insertCall[1];
      const regularizationIdx = 24;
      expect(values[regularizationIdx]).toBe("2026-07-15");
    });

    it("auto-generates employee code when none is provided", async () => {
      const rowNoCode = {
        ...mockValidRow,
        normalized_data: {
          ...mockValidRow.normalized_data,
          employee_code: null,
          email: "nocode@c.com",
        },
      };

      pool.query
        .mockReset()
        .mockResolvedValueOnce({ rows: [mockBatch] })
        .mockResolvedValueOnce({ rows: [rowNoCode] })
        .mockResolvedValueOnce() // importing
        .mockResolvedValue({ rows: [] });

      const client = createClient();
      pool.connect.mockResolvedValue(client);

      getEmployeeCodeSettings.mockResolvedValue(mockSettings);

      client.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // first SELECT by pattern in generateEmployeeCodeRaw (code generation)
        .mockResolvedValueOnce({ rows: [] }) // SELECT check in while loop (code generation)
        .mockResolvedValueOnce({ rows: [] }) // employee code check in commitImport
        .mockResolvedValueOnce({ rows: [] }) // email check
        .mockResolvedValueOnce({ rows: [{ id: 70 }] }) // INSERT employee
        .mockResolvedValueOnce() // INSERT salary
        .mockResolvedValueOnce() // UPDATE row
        .mockResolvedValueOnce(); // COMMIT

      leaveCreditModel.createDefault.mockResolvedValue();

      const req = { ip: "127.0.0.1", headers: {} };
      const result = await service.commitImport(100, 1, req);

      expect(result.importedCount).toBe(1);
    });
  });

  // ──────────────────────────────────────────────
  // getImportHistory
  // ──────────────────────────────────────────────
  describe("getImportHistory", () => {
    it("returns recent batches for the user", async () => {
      const mockRows = [
        {
          batchId: 100,
          originalFilename: null,
          filename: "memory",
          totalRows: 10,
          validRows: 8,
          invalidRows: 2,
          duplicateRows: 0,
          importedCount: null,
          failedCount: null,
          status: "validated",
          createdBy: "System",
          createdAt: new Date(),
          completedAt: null,
        },
      ];
      pool.query.mockReset().mockResolvedValue({ rows: mockRows });

      const result = await service.getImportHistory(1);

      expect(result).toEqual(mockRows);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("FROM employee_import_batches b"));
    });
  });

  // ──────────────────────────────────────────────
  // generateErrorReport
  // ──────────────────────────────────────────────
  describe("generateErrorReport", () => {
    it("returns a workbook with error rows", async () => {
      pool.query.mockReset().mockResolvedValue({
        rows: [
          {
            row_number: 2,
            employee_code: "EMP-001",
            email: "",
            first_name: "Juan",
            last_name: "Dela Cruz",
            branch_name: "Main Branch",
            status: "invalid",
            errors: ["First Name is required", "Invalid Hire Date"],
          },
        ],
      });

      const ws = { columns: null, getRow: jest.fn(), addRow: jest.fn(), mergeCells: jest.fn() };
      const mockWorkbook = { addWorksheet: jest.fn().mockReturnValue(ws) };
      ExcelJS.Workbook.mockImplementation(() => mockWorkbook);

      const mockHeaderRow = { eachCell: jest.fn((cb) => cb({ font: {}, fill: {}, alignment: {}, border: {} })) };
      ws.getRow.mockReturnValue(mockHeaderRow);
      ws.addRow.mockReturnValue({ getCell: jest.fn() });

      const result = await service.generateErrorReport(100);

      expect(result).toBe(mockWorkbook);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith("Errors");
      expect(ws.addRow).toHaveBeenCalledWith(
        expect.objectContaining({ row_number: 2, error_messages: expect.stringContaining("First Name is required") })
      );
    });

    it("shows no errors message when no error rows exist", async () => {
      pool.query.mockReset().mockResolvedValue({ rows: [] });

      const ws = { columns: null, getRow: jest.fn(), addRow: jest.fn(), mergeCells: jest.fn() };
      const mockWorkbook = { addWorksheet: jest.fn().mockReturnValue(ws) };
      ExcelJS.Workbook.mockImplementation(() => mockWorkbook);

      const mockRow = { eachCell: jest.fn((cb) => cb({ font: {}, fill: {}, alignment: {}, border: {} })) };
      ws.getRow.mockReturnValue(mockRow);
      const mockDataRow = { getCell: jest.fn(() => ({ font: {}, alignment: {} })), number: 2 };
      ws.addRow.mockReturnValue(mockDataRow);

      const result = await service.generateErrorReport(100);

      expect(ws.addRow).toHaveBeenCalledWith({});
      expect(ws.mergeCells).toHaveBeenCalled();
    });
  });
});
