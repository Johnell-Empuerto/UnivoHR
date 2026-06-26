const ExcelJS = require("exceljs");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const pool = require("../config/db");
const branchModel = require("../models/branch.model");
const leaveCreditModel = require("../models/leaveCredit.model");
const bcrypt = require("bcrypt");
const audit = require("../services/audit.service");
const { getEmployeeCodeSettings } = require("./applicant.service");
const userModel = require("../models/user.model");
const permissionModel = require("../models/permission.model");
const { EMPLOYEE_DEFAULT_PERMISSIONS } = require("../constants/permissions");

const VALID_EMPLOYMENT_STATUSES = ["PROBATIONARY", "REGULAR"];
const VALID_EMPLOYEE_STATUSES = ["ACTIVE", "RESIGNED", "TERMINATED"];
const VALID_GENDERS = ["MALE", "FEMALE", "OTHER"];

const sanitizeCell = (value) => {
  if (value === undefined || value === null) return "";
  const str = String(value).trim();
  if (str.length === 0) return "";
  return str.replace(/^[=+\-@]/, "");
};

const validateEmail = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const MONTH_NAMES = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const isValidDate = (y, m, d) => {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1900 || y > 2100) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const daysInMonth = new Date(y, m, 0).getDate();
  return d <= daysInMonth;
};

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseExcelSerial = (serial) => {
  if (typeof serial !== "number" || serial < 1 || serial > 200000) return null;
  const excelEpoch = new Date(1900, 0, 1);
  const date = new Date(excelEpoch.getTime() + (serial - 2) * 86400000);
  return formatLocalDate(date);
};

const validateDate = (dateValue) => {
  try {
    if (dateValue === undefined || dateValue === null) return null;
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return formatLocalDate(dateValue);
    }

    if (typeof dateValue === "number") {
      return parseExcelSerial(dateValue);
    }

    let str = String(dateValue).trim();
    if (!str) return null;

    if (/^\d{5,8}$/.test(str) && str.length > 4) {
      const num = parseInt(str, 10);
      if (num >= 1 && num <= 200000) return parseExcelSerial(num);
    }

    let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (match) {
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const d = parseInt(match[3], 10);
      if (isValidDate(y, m, d)) {
        return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
      return null;
    }

    match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      const m = parseInt(match[1], 10);
      const d = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);
      if (isValidDate(y, m, d)) {
        return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
      return null;
    }

    const date = new Date(str);
    if (isNaN(date.getTime())) return null;

    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();

    const lowerStr = str.toLowerCase();
    for (const [name, expectedMonth] of Object.entries(MONTH_NAMES)) {
      if (lowerStr.includes(name)) {
        if (m !== expectedMonth) return null;
        break;
      }
    }

    if (!isValidDate(y, m, d)) return null;

    return formatLocalDate(date);
  } catch {
    return null;
  }
};

const generateTemplate = async () => {
  const workbook = new ExcelJS.Workbook();

  const ws = workbook.addWorksheet("Template", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const columns = [
    { header: "Employee Code", key: "employee_code", width: 18 },
    { header: "First Name", key: "first_name", width: 20 },
    { header: "Middle Name", key: "middle_name", width: 18 },
    { header: "Last Name", key: "last_name", width: 20 },
    { header: "Suffix", key: "suffix", width: 10 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Gender", key: "gender", width: 12 },
    { header: "Birth Date", key: "birth_date", width: 14 },
    { header: "Hire Date", key: "hire_date", width: 14 },
    { header: "Branch", key: "branch", width: 22 },
    { header: "Department", key: "department", width: 20 },
    { header: "Position", key: "position", width: 20 },
    { header: "Employment Status", key: "employment_status", width: 22 },
    { header: "Employee Status", key: "employee_status", width: 18 },
    { header: "Basic Salary", key: "basic_salary", width: 14 },
    { header: "Address", key: "address", width: 30 },
    { header: "SSS Number", key: "sss_number", width: 18 },
    { header: "PhilHealth Number", key: "philhealth_number", width: 20 },
    { header: "Pag-IBIG Number", key: "pagibig_number", width: 18 },
    { header: "TIN Number", key: "tin_number", width: 16 },
    { header: "Emergency Contact Name", key: "emergency_contact_name", width: 24 },
    { header: "Emergency Contact Number", key: "emergency_contact_number", width: 24 },
    { header: "Emergency Contact Address", key: "emergency_contact_address", width: 30 },
    { header: "Emergency Contact Relation", key: "emergency_contact_relation", width: 22 },
    { header: "Username", key: "username", width: 22 },
    { header: "Password", key: "password", width: 18 },
    { header: "Role", key: "role", width: 14 },
  ];

  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const sampleRow = ws.addRow({
    employee_code: "EMP-001",
    first_name: "Juan",
    middle_name: "D.",
    last_name: "Dela Cruz",
    suffix: "Jr.",
    email: "juan.delacruz@company.com",
    phone: "09171234567",
    gender: "Male",
    birth_date: "1990-01-15",
    hire_date: "2025-06-01",
    branch: "Main Branch",
    department: "Information Technology",
    position: "Software Developer",
    employment_status: "Probationary",
    employee_status: "ACTIVE",
    basic_salary: 25000,
    address: "123 Rizal St., Barangay San Antonio, Makati City",
    sss_number: "12-3456789-0",
    philhealth_number: "12-345678901-2",
    pagibig_number: "1234-5678-9012",
    tin_number: "123-456-789-000",
    emergency_contact_name: "Maria Dela Cruz",
    emergency_contact_number: "09179876543",
    emergency_contact_address: "456 Mabini St., Makati City",
    emergency_contact_relation: "Mother",
    username: "",
    password: "",
    role: "",
  });

  sampleRow.eachCell((cell) => {
    cell.font = { size: 10 };
    cell.alignment = { vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const instructions = workbook.addWorksheet("Instructions");

  const instructionsData = [
    ["EMPLOYEE BULK IMPORT \u2014 INSTRUCTIONS"],
    [""],
    ["REQUIRED FIELDS (must not be blank):"],
    ["  - First Name"],
    ["  - Last Name"],
    ["  - Hire Date"],
    ["  - Branch"],
    [""],
    ["EMPLOYEE CODE:"],
    ["  - If auto-generation is enabled in Settings \u2192 Employee Codes:"],
    ["      Leave blank to auto-generate"],
    ["      OR provide a custom code (must be unique)"],
    ["  - If auto-generation is disabled:"],
    ["      Employee Code is required and must be unique."],
    [""],
    ["BRANCH:"],
    ["  - Must match an existing active Branch Name or Branch Code exactly."],
    ['  - Example: "Main Branch" or "MAIN"'],
    [""],
    ["HIRE DATE:"],
    ["  - Must be a valid date."],
    ["  - Cannot be a future date."],
    [""],
    ["DATE FORMATS (accepted for Birth Date and Hire Date):"],
    ["  - M/D/YYYY          Example: 1/15/1999 or 6/1/2025"],
    ["  - MM/DD/YYYY        Example: 01/15/1999 or 06/01/2025"],
    ["  - YYYY-MM-DD        Example: 1999-01-15 or 2025-06-01"],
    ["  - YYYY/MM/DD        Example: 1999/01/15 or 2025/06/01"],
    ["  - DD-MMM-YYYY       Example: 15-Jan-1999 or 1-Jun-2025"],
    ["  - DD Month YYYY     Example: 15 January 1999 or 1 June 2025"],
    ["  - MMM DD, YYYY      Example: Jan 15, 1999 or Jun 1, 2025"],
    ["  - Month DD, YYYY    Example: January 15, 1999 or June 1, 2025"],
    ["  - Excel Date Cell   Cells formatted as Date are read automatically"],
    ["  - Excel Serial      Numeric serial dates (e.g., 36175) are supported"],
    ["  - Mixed formats     Different date formats can be used in the same file"],
    [""],
    ["EMPLOYMENT STATUS (accepted values):"],
    ["  - Probationary  (default)"],
    ["  - Regular"],
    [""],
    ["EMPLOYEE STATUS (accepted values):"],
    ["  - ACTIVE         (default)"],
    ["  - RESIGNED"],
    ["  - TERMINATED"],
    [""],
    ["GENDER (accepted values):"],
    ["  - Male"],
    ["  - Female"],
    ["  - Other"],
    [""],
    ["BASIC SALARY:"],
    ["  - Must be a positive number if provided."],
    ["  - Leave blank to set to 0.00 (can be updated later)."],
    [""],
    ["EMAIL:"],
    ["  - Optional but must be a valid email format if provided."],
    ["  - Must be unique across all employees if provided."],
    [""],
    ["USER ACCOUNT (optional):"],
    ["  - Leave Username, Password, and Role blank to create employee only."],
    ["  - If Username is provided, Password and Role are also required."],
    ["  - Username must be unique across all users."],
    ["  - Password must be at least 4 characters."],
    ["  - Role accepted values: EMPLOYEE (default), ADMIN"],
    ["  - When account data is provided, BOTH the employee record AND a"],
    ["    login account will be created during import."],
    [""],
    ["IMPORTANT NOTES:"],
    ["  - Do NOT rename, reorder, or remove column headers."],
    ["  - Rows with errors will be rejected. Fix errors and re-upload."],
    ["  - Uploaded files are deleted immediately after processing."],
  ];

  instructionsData.forEach((row) => {
    const r = instructions.addRow(row);
    r.eachCell((cell) => {
      cell.font = { size: 11 };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });

  instructions.getColumn(1).width = 80;

  const titleRow = instructions.getRow(1);
  titleRow.eachCell((cell) => {
    cell.font = { bold: true, size: 14, color: { argb: "FF2563EB" } };
  });

  return workbook;
};

const parseAndValidate = async (filePath, userId) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  if (rawData.length === 0) {
    throw new Error("File is empty or has no data rows");
  }

  const MAX_ROWS = 10000;
  if (rawData.length > MAX_ROWS) {
    throw new Error(`Maximum ${MAX_ROWS} rows allowed per upload. Found ${rawData.length} rows.`);
  }

  const employeeCodeSettings = await getEmployeeCodeSettings(pool);
  const autoGenerateEnabled = employeeCodeSettings.autoGenerate === "true";

  const allBranches = await branchModel.getAll();
  const branchLookup = {};
  for (const b of allBranches) {
    branchLookup[b.name.toLowerCase()] = b;
    if (b.code) branchLookup[b.code.toLowerCase()] = b;
  }

  const existingCodesResult = await pool.query(`SELECT employee_code FROM employees WHERE employee_code IS NOT NULL`);
  const existingCodeSet = new Set(existingCodesResult.rows.map((r) => r.employee_code));

  const existingEmailsResult = await pool.query(`SELECT email FROM employees WHERE email IS NOT NULL AND email != ''`);
  const existingEmailSet = new Set(existingEmailsResult.rows.map((r) => r.email.toLowerCase()));

  const previewRows = [];
  const allErrors = [];
  const seenCodesInFile = new Map();
  const seenEmailsInFile = new Map();
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  const validRowsData = [];
  const invalidRowsData = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const rowNumber = i + 2;
    const errors = [];
    let isDuplicate = false;

    const employeeCode = sanitizeCell(row["Employee Code"]);
    const firstName = sanitizeCell(row["First Name"]);
    const middleName = sanitizeCell(row["Middle Name"]);
    const lastName = sanitizeCell(row["Last Name"]);
    const suffix = sanitizeCell(row["Suffix"]);
    const email = sanitizeCell(row["Email"]);
    const phone = sanitizeCell(row["Phone"]);
    const gender = sanitizeCell(row["Gender"]);
    const birthDateRaw = row["Birth Date"];
    const hireDateRaw = row["Hire Date"];
    const branchRaw = sanitizeCell(row["Branch"]);
    const department = sanitizeCell(row["Department"]);
    const position = sanitizeCell(row["Position"]);
    const employmentStatus = sanitizeCell(row["Employment Status"]);
    const employeeStatus = sanitizeCell(row["Employee Status"]);
    const basicSalaryRaw = row["Basic Salary"];
    const address = sanitizeCell(row["Address"]);
    const sssNumber = sanitizeCell(row["SSS Number"]);
    const philhealthNumber = sanitizeCell(row["PhilHealth Number"]);
    const pagibigNumber = sanitizeCell(row["Pag-IBIG Number"]);
    const tinNumber = sanitizeCell(row["TIN Number"]);
    const emergencyContactName = sanitizeCell(row["Emergency Contact Name"]);
    const emergencyContactNumber = sanitizeCell(row["Emergency Contact Number"]);
    const emergencyContactAddress = sanitizeCell(row["Emergency Contact Address"]);
    const emergencyContactRelation = sanitizeCell(row["Emergency Contact Relation"]);
    const username = sanitizeCell(row["Username"]);
    const password = sanitizeCell(row["Password"]);
    const role = sanitizeCell(row["Role"]);

    const resolvedBranch = resolveBranch(branchRaw, branchLookup);
    let branchResolved = branchRaw;
    let branchId = null;
    let branchName = "";

    if (!firstName) errors.push("First Name is required");
    if (!lastName) errors.push("Last Name is required");

    if (!branchRaw) {
      errors.push("Branch is required");
    } else {
      if (resolvedBranch.error) {
        errors.push(resolvedBranch.error);
      } else {
        branchId = resolvedBranch.branch_id;
        const matchedBranch = allBranches.find((b) => b.id === branchId);
        branchName = matchedBranch ? matchedBranch.name : branchRaw;
        branchResolved = matchedBranch ? `${matchedBranch.name} (${matchedBranch.code || "N/A"})` : branchRaw;
      }
    }

    let parsedHireDate = null;
    if (!hireDateRaw) {
      errors.push("Hire Date is required");
    } else {
      parsedHireDate = validateDate(hireDateRaw);
      if (!parsedHireDate) {
        errors.push("Invalid Hire Date format");
      } else {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (new Date(parsedHireDate) > today) {
          errors.push("Hire Date cannot be a future date");
        }
      }
    }

    let parsedBirthDate = null;
    if (birthDateRaw) {
      parsedBirthDate = validateDate(birthDateRaw);
      if (!parsedBirthDate) {
        errors.push("Invalid Birth Date format");
      }
    }

    if (email) {
      if (!validateEmail(email)) {
        errors.push("Invalid Email format");
      }
    }

    if (gender) {
      const normalizedGender = gender.toUpperCase();
      if (!VALID_GENDERS.includes(normalizedGender)) {
        errors.push(`Invalid Gender "${gender}". Accepted: Male, Female, Other`);
      }
    }

    if (employmentStatus) {
      const normalizedStatus = employmentStatus.toUpperCase();
      if (!VALID_EMPLOYMENT_STATUSES.includes(normalizedStatus)) {
        errors.push(`Invalid Employment Status "${employmentStatus}". Accepted: Probationary, Regular`);
      }
    }

    if (employeeStatus) {
      const normalizedEmpStatus = employeeStatus.toUpperCase();
      if (!VALID_EMPLOYEE_STATUSES.includes(normalizedEmpStatus)) {
        errors.push(`Invalid Employee Status "${employeeStatus}". Accepted: ACTIVE, RESIGNED, TERMINATED`);
      }
    }

    let parsedSalary = 0;
    if (basicSalaryRaw !== undefined && basicSalaryRaw !== null && basicSalaryRaw !== "") {
      parsedSalary = Number(basicSalaryRaw);
      if (isNaN(parsedSalary) || parsedSalary < 0) {
        errors.push("Basic Salary must be a valid positive number");
        parsedSalary = 0;
      }
    }

    let accountInfo = null;
    if (username) {
      if (!password) {
        errors.push("Password is required when Username is provided");
      } else if (password.length < 4) {
        errors.push("Password must be at least 4 characters");
      }
      const normalizedRole = role ? role.toUpperCase() : "EMPLOYEE";
      if (role && !["ADMIN", "EMPLOYEE"].includes(normalizedRole)) {
        errors.push(`Invalid Role "${role}". Accepted: ADMIN, EMPLOYEE`);
      }
      const normalizedUsername = username.toLowerCase().trim();
      const dupCheckResult = await pool.query(
        `SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
        [normalizedUsername]
      );
      if (dupCheckResult.rows.length > 0) {
        errors.push(`Username "${username}" already exists`);
      }
      accountInfo = { username: normalizedUsername, password, role: normalizedRole };
    }

    if (employeeCode) {
      const codeUpper = employeeCode.toUpperCase();
      if (seenCodesInFile.has(codeUpper)) {
        errors.push(`Duplicate Employee Code "${employeeCode}" in file (first occurrence at row ${seenCodesInFile.get(codeUpper)})`);
        isDuplicate = true;
      } else {
        seenCodesInFile.set(codeUpper, rowNumber);
      }

      if (existingCodeSet.has(employeeCode)) {
        errors.push(`Employee Code "${employeeCode}" already exists in the system`);
        isDuplicate = true;
      }
    } else {
      if (!autoGenerateEnabled) {
        errors.push("Employee Code is required because auto-generation is disabled in Settings");
      }
    }

    if (email) {
      const emailLower = email.toLowerCase();
      if (seenEmailsInFile.has(emailLower)) {
        errors.push(`Duplicate Email "${email}" in file (first occurrence at row ${seenEmailsInFile.get(emailLower)})`);
        isDuplicate = true;
      } else {
        seenEmailsInFile.set(emailLower, rowNumber);
      }

      if (existingEmailSet.has(emailLower)) {
        errors.push(`Email "${email}" already exists in the system`);
        isDuplicate = true;
      }
    }

    const isValid = errors.length === 0;

    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }
    if (isDuplicate) {
      duplicateCount++;
    }

    const previewRow = {
      rowNumber,
      status: isValid ? "valid" : "invalid",
      employeeCode: employeeCode || (autoGenerateEnabled ? "(auto-generate)" : ""),
      firstName,
      lastName,
      branch: branchResolved,
      errors: isValid ? [] : errors,
    };
    previewRows.push(previewRow);

    for (const err of errors) {
      const field = err.startsWith("First Name") ? "First Name"
        : err.startsWith("Last Name") ? "Last Name"
        : err.startsWith("Branch") ? "Branch"
        : err.startsWith("Hire Date") ? "Hire Date"
        : err.startsWith("Birth Date") ? "Birth Date"
        : err.startsWith("Email") ? "Email"
        : err.startsWith("Gender") ? "Gender"
        : err.startsWith("Employment Status") ? "Employment Status"
        : err.startsWith("Employee Status") ? "Employee Status"
        : err.startsWith("Basic Salary") ? "Basic Salary"
        : err.startsWith("Duplicate") ? (err.includes("Code") ? "Employee Code" : "Email")
        : err.startsWith("Employee Code") ? "Employee Code"
        : "General";
      allErrors.push({ rowNumber, field, message: err });
    }

    if (isValid) {
      const normalizedData = {
        employee_code: employeeCode || null,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        suffix: suffix || null,
        email: email || null,
        contact_number: phone || null,
        gender: gender ? gender.toUpperCase() : null,
        birthday: parsedBirthDate,
        hired_date: parsedHireDate,
        branch_id: branchId,
        branch_name: branchName,
        department: department || null,
        position: position || null,
        employment_status: employmentStatus ? employmentStatus.toUpperCase() : "REGULAR",
        status: employeeStatus ? employeeStatus.toUpperCase() : "ACTIVE",
        basic_salary: parsedSalary,
        address: address || null,
        sss_number: sssNumber || null,
        philhealth_number: philhealthNumber || null,
        hdmf_number: pagibigNumber || null,
        tin_number: tinNumber || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_number: emergencyContactNumber || null,
        emergency_contact_address: emergencyContactAddress || null,
        emergency_contact_relation: emergencyContactRelation || null,
        account: accountInfo,
      };
      validRowsData.push({ rowNumber, employeeCode, email, firstName, lastName, branchName, branchId, errors, normalizedData });
    } else {
      invalidRowsData.push({ rowNumber, employeeCode, email, firstName, lastName, branchName: branchRaw, errors });
    }
  }

  const batchResult = await pool.query(
    `INSERT INTO employee_import_batches (filename, total_rows, valid_rows, invalid_rows, duplicate_rows, status, created_by)
     VALUES ($1, $2, $3, $4, $5, 'validated', $6)
     RETURNING id`,
    ["memory", rawData.length, validCount, invalidCount, duplicateCount, userId]
  );
  const batchId = batchResult.rows[0].id;

  for (const v of validRowsData) {
    const rawDataRow = rawData[v.rowNumber - 2];
    await pool.query(
      `INSERT INTO employee_import_rows (batch_id, row_number, status, employee_code, email, first_name, last_name, branch_name, branch_id, normalized_data)
       VALUES ($1, $2, 'valid', $3, $4, $5, $6, $7, $8, $9)`,
      [batchId, v.rowNumber, v.employeeCode || null, v.email || null, v.firstName, v.lastName, v.branchName, v.branchId, JSON.stringify(v.normalizedData)]
    );
  }

  for (const inv of invalidRowsData) {
    const rawDataRow = rawData[inv.rowNumber - 2];
    await pool.query(
      `INSERT INTO employee_import_rows (batch_id, row_number, status, employee_code, email, first_name, last_name, errors)
       VALUES ($1, $2, 'invalid', $3, $4, $5, $6, $7)`,
      [batchId, inv.rowNumber, inv.employeeCode || null, inv.email || null, inv.firstName, inv.lastName, inv.lastName ? JSON.stringify(inv.errors) : JSON.stringify(inv.errors)]
    );
  }

  return {
    batchId,
    summary: {
      totalRows: rawData.length,
      validRows: validCount,
      invalidRows: invalidCount,
      duplicateRows: duplicateCount,
    },
    previewRows,
    errors: allErrors,
  };
};

const commitImport = async (batchId, userId, req) => {
  const batchResult = await pool.query(`SELECT * FROM employee_import_batches WHERE id = $1`, [batchId]);
  if (batchResult.rows.length === 0) {
    throw new Error(`Batch ${batchId} not found`);
  }
  const batch = batchResult.rows[0];
  if (batch.status !== "validated") {
    throw new Error(`Batch ${batchId} is in status "${batch.status}". Only validated batches can be committed.`);
  }

  const rowsResult = await pool.query(
    `SELECT * FROM employee_import_rows WHERE batch_id = $1 AND status = 'valid' ORDER BY row_number`,
    [batchId]
  );
  if (rowsResult.rows.length === 0) {
    throw new Error("No valid rows to import");
  }

  const validRows = rowsResult.rows;

  await pool.query(
    `UPDATE employee_import_batches SET status = 'importing' WHERE id = $1`,
    [batchId]
  );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const row of validRows) {
      const nd = row.normalized_data;
      let employeeCode = nd.employee_code || null;

      if (!employeeCode) {
        const genResult = await generateEmployeeCodeRaw(client);
        employeeCode = genResult.code;
      }

      const existingCode = await client.query(
        `SELECT id FROM employees WHERE employee_code = $1 LIMIT 1`,
        [employeeCode]
      );
      if (existingCode.rows.length > 0) {
        throw new Error(`Employee Code "${employeeCode}" already exists at commit time (row ${row.row_number})`);
      }

      if (nd.email) {
        const existingEmail = await client.query(
          `SELECT id FROM employees WHERE LOWER(email) = LOWER($1) AND email IS NOT NULL AND email != '' LIMIT 1`,
          [nd.email]
        );
        if (existingEmail.rows.length > 0) {
          throw new Error(`Email "${nd.email}" already exists at commit time (row ${row.row_number})`);
        }
      }

      let regularizationDate = null;
      if (nd.employment_status === "PROBATIONARY" && nd.hired_date) {
        const hireDate = new Date(nd.hired_date);
        regularizationDate = new Date(hireDate.setMonth(hireDate.getMonth() + 6)).toISOString().split("T")[0];
      }

      const empResult = await client.query(
        `INSERT INTO employees (
          first_name, middle_name, last_name, suffix,
          employee_code, email, department, position,
          birthday, gender, contact_number, address,
          emergency_contact_name, emergency_contact_number,
          emergency_contact_address, emergency_contact_relation,
          status, sss_number, philhealth_number, hdmf_number, tin_number,
          hired_date, branch_id, employment_status, regularization_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
        RETURNING id`,
        [
          nd.first_name || null,
          nd.middle_name || null,
          nd.last_name || null,
          nd.suffix || null,
          employeeCode,
          nd.email || null,
          nd.department || null,
          nd.position || null,
          nd.birthday || null,
          nd.gender || null,
          nd.contact_number || null,
          nd.address || null,
          nd.emergency_contact_name || null,
          nd.emergency_contact_number || null,
          nd.emergency_contact_address || null,
          nd.emergency_contact_relation || null,
          nd.status || "ACTIVE",
          nd.sss_number || null,
          nd.philhealth_number || null,
          nd.hdmf_number || null,
          nd.tin_number || null,
          nd.hired_date || null,
          nd.branch_id,
          nd.employment_status || "REGULAR",
          regularizationDate,
        ]
      );

      const employeeId = empResult.rows[0].id;

      const basicSalary = (nd.basic_salary && !isNaN(Number(nd.basic_salary))) ? Number(nd.basic_salary) : 0;
      await client.query(
        `INSERT INTO employee_salary (employee_id, basic_salary, overtime_rate)
         VALUES ($1, $2, 1.25)
         ON CONFLICT (employee_id) DO NOTHING`,
        [employeeId, basicSalary]
      );

      await leaveCreditModel.createDefault(employeeId, client);

      if (nd.account && nd.account.username) {
        const existingUser = await client.query(
          `SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
          [nd.account.username]
        );
        if (existingUser.rows.length > 0) {
          throw new Error(`Username "${nd.account.username}" already exists (row ${row.row_number})`);
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(nd.account.password, saltRounds);
        const userResult = await client.query(
          `INSERT INTO users (username, password_hash, role, employee_id)
           VALUES ($1, $2, $3, $4)
           RETURNING id, username, role, employee_id`,
          [nd.account.username, hashedPassword, nd.account.role, employeeId]
        );
        const newUser = userResult.rows[0];
        if (newUser && nd.account.role !== "ADMIN") {
          await permissionModel.setUserPermissions(newUser.id, EMPLOYEE_DEFAULT_PERMISSIONS);
        }
      }

      await client.query(
        `UPDATE employee_import_rows SET status = 'imported', created_employee_id = $1 WHERE id = $2`,
        [employeeId, row.id]
      );
    }

    await client.query("COMMIT");
    client.release();

    const importedCount = validRows.length;
    let accountsCreated = 0;
    for (const row of validRows) {
      if (row.normalized_data?.account?.username) accountsCreated++;
    }

    await pool.query(
      `UPDATE employee_import_batches
       SET status = 'completed', imported_count = $1, completed_at = NOW()
       WHERE id = $2`,
      [importedCount, batchId]
    );

    try {
      const settings = await getEmployeeCodeSettings(pool);
      if (settings.autoGenerate === "true") {
        const prefix = settings.prefix || "EMP";
        const separator = settings.separator || "";
        const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedSep = separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const patternStr = `^${escapedPrefix}${escapedSep}[0-9]+$`;

        const codeResult = await pool.query(
          `SELECT employee_code FROM employees
           WHERE employee_code ~ $1
           ORDER BY CAST(SUBSTRING(employee_code FROM $2) AS INTEGER) DESC LIMIT 1`,
          [patternStr, prefix.length + separator.length + 1]
        );

        if (codeResult.rows.length > 0) {
          const numStr = codeResult.rows[0].employee_code.slice(prefix.length + separator.length);
          const num = parseInt(numStr, 10);
          if (!isNaN(num)) {
            await pool.query(
              `UPDATE system_settings SET value = $1, updated_at = NOW() WHERE key = 'employee_code_counter'`,
              [String(num)]
            );
          }
        }
      }
    } catch (counterErr) {
      console.error("[EmployeeBulk] Failed to update code counter:", counterErr.message);
    }

    try {
      const desc = accountsCreated > 0
        ? `Bulk import completed: ${importedCount} employees imported with ${accountsCreated} accounts created, ${batch.invalid_rows} invalid rows skipped (batch ${batchId})`
        : `Bulk import completed: ${importedCount} employees imported, ${batch.invalid_rows} invalid rows skipped (batch ${batchId})`;
      await audit.auditLog(req, {
        action: "BULK_IMPORT",
        table_name: "employees",
        record_id: null,
        employee_id: null,
        branch_id: null,
        new_values: { batchId, importedCount, accountsCreated, invalidRows: batch.invalid_rows },
        description: desc,
      });
    } catch (auditErr) {
      console.error("[EmployeeBulk] Audit log error:", auditErr.message);
    }

    return {
      importedCount,
      accountsCreated,
      failedCount: 0,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    client.release();

    await pool.query(
      `UPDATE employee_import_batches
       SET status = 'failed', failed_count = $1, notes = $2
       WHERE id = $3`,
      [validRows.length, error.message, batchId]
    );

    throw error;
  }
};

const generateEmployeeCodeRaw = async (client) => {
  const db = client || pool;
  const settings = await getEmployeeCodeSettings(db);
  const prefix = settings.prefix || "EMP";
  const separator = settings.separator || "";
  const padding = Math.max(0, parseInt(settings.padding) || 4);
  const counter = Math.max(0, parseInt(settings.counter) || 0);

  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedSep = separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patternStr = `^${escapedPrefix}${escapedSep}[0-9]+$`;

  const result = await db.query(
    `SELECT employee_code FROM employees
     WHERE employee_code ~ $1
     ORDER BY CAST(SUBSTRING(employee_code FROM $2) AS INTEGER) DESC LIMIT 1`,
    [patternStr, prefix.length + separator.length + 1]
  );

  let nextNumber = counter + 1;
  if (result.rows.length > 0) {
    const numStr = result.rows[0].employee_code.slice(prefix.length + separator.length);
    const num = parseInt(numStr, 10);
    if (!isNaN(num)) nextNumber = Math.max(nextNumber, num + 1);
  }

  let code;
  while (true) {
    code = `${prefix}${separator}${String(nextNumber).padStart(padding, "0")}`;
    const exists = await db.query(
      `SELECT id FROM employees WHERE employee_code = $1 LIMIT 1`,
      [code]
    );
    if (exists.rows.length === 0) break;
    nextNumber++;
  }

  return { code, number: nextNumber };
};

const getImportHistory = async (userId) => {
  const result = await pool.query(`
    SELECT
      b.id AS "batchId",
      b.original_filename AS "originalFilename",
      b.filename,
      b.total_rows AS "totalRows",
      b.valid_rows AS "validRows",
      b.invalid_rows AS "invalidRows",
      b.duplicate_rows AS "duplicateRows",
      b.imported_count AS "importedCount",
      b.failed_count AS "failedCount",
      b.status,
      COALESCE(u.username, 'System') AS "createdBy",
      b.created_at AS "createdAt",
      b.completed_at AS "completedAt"
    FROM employee_import_batches b
    LEFT JOIN users u ON u.id = b.created_by
    ORDER BY b.created_at DESC
    LIMIT 50
  `);
  return result.rows;
};

const generateErrorReport = async (batchId) => {
  const rowsResult = await pool.query(
    `SELECT row_number, employee_code, email, first_name, last_name, branch_name, status, errors
     FROM employee_import_rows
     WHERE batch_id = $1 AND status IN ('invalid', 'failed')
     ORDER BY row_number`,
    [batchId]
  );

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Errors");

  const columns = [
    { header: "Row Number", key: "row_number", width: 14 },
    { header: "Employee Code", key: "employee_code", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "First Name", key: "first_name", width: 20 },
    { header: "Last Name", key: "last_name", width: 20 },
    { header: "Branch", key: "branch", width: 22 },
    { header: "Status", key: "status", width: 12 },
    { header: "Error Messages", key: "error_messages", width: 60 },
  ];
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width }));

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDC2626" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" },
      bottom: { style: "thin" }, right: { style: "thin" },
    };
  });

  if (rowsResult.rows.length === 0) {
    const r = ws.addRow({});
    r.getCell(1).value = "No validation errors found.";
    ws.mergeCells(`A${r.number}:H${r.number}`);
    r.getCell(1).font = { italic: true, size: 12 };
    r.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  } else {
    for (const row of rowsResult.rows) {
      const errMsgs = row.errors
        ? (Array.isArray(row.errors) ? row.errors.map((e) => (typeof e === "string" ? e : e.message || JSON.stringify(e))).join("; ") : String(row.errors))
        : "";
      ws.addRow({
        row_number: row.row_number,
        employee_code: row.employee_code || "",
        email: row.email || "",
        first_name: row.first_name || "",
        last_name: row.last_name || "",
        branch: row.branch_name || "",
        status: row.status,
        error_messages: errMsgs,
      });
    }
  }

  return workbook;
};

const resolveBranch = (branchValue, branchLookup) => {
  const trimmed = branchValue?.toString().trim();
  if (!trimmed) {
    return { branch_id: null };
  }
  const key = trimmed.toLowerCase();
  const match = branchLookup[key];
  if (!match) {
    return { error: `Branch "${trimmed}" was not found in the system. Check your branch name or code.` };
  }
  if (!match.is_active) {
    return { error: `Branch "${trimmed}" is inactive. Please select an active branch.` };
  }
  return { branch_id: match.id };
};

module.exports = {
  generateTemplate,
  parseAndValidate,
  commitImport,
  getImportHistory,
  generateErrorReport,
};