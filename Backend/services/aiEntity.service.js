const pool = require("../config/db");

// ========== DATE/TIME PERIOD DETECTION ==========

const TIME_PERIODS = {
  today: { label: "today", fn: () => ({ date_from: getToday(), date_to: getToday() }) },
  yesterday: { label: "yesterday", fn: () => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return { date_from: toDateStr(d), date_to: toDateStr(d) };
  }},
  this_week: { label: "this week", fn: () => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now); start.setDate(now.getDate() - day);
    const end = new Date(now); end.setDate(start.getDate() + 6);
    return { date_from: toDateStr(start), date_to: toDateStr(end) };
  }},
  last_week: { label: "last week", fn: () => {
    const now = new Date();
    const end = new Date(now); end.setDate(now.getDate() - now.getDay() - 1);
    const start = new Date(end); start.setDate(end.getDate() - 6);
    return { date_from: toDateStr(start), date_to: toDateStr(end) };
  }},
  this_month: { label: "this month", fn: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { date_from: toDateStr(start), date_to: toDateStr(end) };
  }},
  last_month: { label: "last month", fn: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { date_from: toDateStr(start), date_to: toDateStr(end) };
  }},
};

const getToday = () => new Date().toISOString().split("T")[0];
const toDateStr = (d) => d.toISOString().split("T")[0];

// ========== TIME PERIOD KEYWORDS ==========

const TIME_KEYWORDS = [
  { pattern: /\byesterday\b/i, id: "yesterday" },
  { pattern: /\btoday\b/i, id: "today" },
  { pattern: /\bthis\s+week\b/i, id: "this_week" },
  { pattern: /\blast\s+week\b/i, id: "last_week" },
  { pattern: /\bthis\s+month\b/i, id: "this_month" },
  { pattern: /\blast\s+month\b/i, id: "last_month" },
  { pattern: /\bthis\s+cutoff\b/i, id: "this_cutoff" },
  { pattern: /\blast\s+cutoff\b/i, id: "last_cutoff" },
  { pattern: /\bthis\s+payroll\b/i, id: "this_cutoff" },
  { pattern: /\blast\s+payroll\b/i, id: "last_cutoff" },
];

const detectTimePeriod = (question) => {
  for (const { pattern, id } of TIME_KEYWORDS) {
    if (pattern.test(question)) {
      return TIME_PERIODS[id] ? TIME_PERIODS[id].fn() : null;
    }
  }
  return null;
};

// ========== EMPLOYEE NAME NORMALIZATION ==========

const SUFFIXES = ["sr", "jr", "ii", "iii", "iv", "v"];

const normalizeName = (raw) => {
  let name = raw.trim();
  // Remove leading "of", "for", "by" etc.
  name = name.replace(/^(?:of|for|by|employee)\s+/i, "");
  // Strip trailing comma + suffix
  name = name.replace(/,\s*(Sr\.?|Jr\.?|II|III|IV|V)\s*$/i, "");
  // Strip trailing suffix without comma
  name = name.replace(/\s+(Sr\.?|Jr\.?|II|III|IV|V)\s*$/i, "");
  // Normalize multiple spaces
  name = name.replace(/\s+/g, " ").trim();
  // Remove trailing period from initials
  name = name.replace(/\./g, "");
  return name;
};

const parseNameParts = (name) => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { first: parts[0], middle: null, last: null };
  if (parts.length === 2) return { first: parts[0], middle: null, last: parts[1] };
  if (parts.length === 3) return { first: parts[0], middle: parts[1], last: parts[2] };
  return { first: parts[0], middle: parts[1], last: parts.slice(2).join(" ") };
};

// ========== EMPLOYEE DETECTION ==========

const findEmployeeByExactName = async (name) => {
  const norm = normalizeName(name);
  const parts = parseNameParts(norm);

  // Helper: compare with REPLACE to strip periods from DB values
  const queries = [];

  // Strategy 1: Full name match (first middle last) with period-insensitive comparison
  if (parts.middle) {
    queries.push({
      text: `LOWER(REPLACE(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name), '.', '')) = LOWER($1)`,
      param: norm,
    });
    // Also try without middle initial
    queries.push({
      text: `LOWER(REPLACE(CONCAT(first_name, ' ', last_name), '.', '')) = LOWER($1)`,
      param: `${parts.first} ${parts.last}`,
    });
  }

  // Strategy 2: First + last
  queries.push({
    text: `LOWER(REPLACE(CONCAT(first_name, ' ', last_name), '.', '')) = LOWER($1)`,
    param: `${parts.first} ${parts.last}`,
  });

  // Strategy 3: Full name any order (last, first middle)
  if (parts.middle) {
    queries.push({
      text: `LOWER(REPLACE(CONCAT(last_name, ' ', first_name, ' ', COALESCE(middle_name, '')), '.', '')) = LOWER($1)`,
      param: norm,
    });
    queries.push({
      text: `LOWER(REPLACE(CONCAT(last_name, ' ', first_name), '.', '')) = LOWER($1)`,
      param: `${parts.last} ${parts.first}`,
    });
  }

  // Strategy 4: Last, First format
  if (parts.last) {
    queries.push({
      text: `LOWER(REPLACE(CONCAT(last_name, ' ', first_name), '.', '')) = LOWER($1)`,
      param: `${parts.last} ${parts.first}`,
    });
  }

  for (const q of queries) {
    const result = await pool.query(`
      SELECT id, employee_code, first_name, middle_name, last_name, suffix, department, branch_id
      FROM employees
      WHERE ${q.text}
      LIMIT 1
    `, [q.param]);
    if (result.rows[0]) return result.rows[0];
  }

  return null;
};

const findEmployeeByFuzzyName = async (name) => {
  const norm = normalizeName(name);
  const parts = parseNameParts(norm);

  const results = [];

  // Single word: search both first and last name
  if (!parts.last && parts.first) {
    const r = await pool.query(`
      SELECT id, employee_code, first_name, middle_name, last_name, suffix, department, branch_id
      FROM employees
      WHERE LOWER(last_name) = LOWER($1)
         OR LOWER(first_name) = LOWER($1)
      LIMIT 5
    `, [parts.first]);
    results.push(...r.rows);
    // Deduplicate and return
    const seen = new Set();
    return results.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
  }

  // Search by first name + partial last
  if (parts.last) {
    const r = await pool.query(`
      SELECT id, employee_code, first_name, middle_name, last_name, suffix, department, branch_id
      FROM employees
      WHERE LOWER(first_name) = LOWER($1)
        AND LOWER(last_name) LIKE LOWER($2)
      LIMIT 5
    `, [parts.first, `${parts.last}%`]);
    results.push(...r.rows);
  }

  // Search by last name only (for "show payroll of Aquino" type queries)
  if (!results.length && parts.last) {
    const r = await pool.query(`
      SELECT id, employee_code, first_name, middle_name, last_name, suffix, department, branch_id
      FROM employees
      WHERE LOWER(last_name) = LOWER($1)
      LIMIT 5
    `, [parts.last]);
    results.push(...r.rows);
  }

  // Search by middle name
  if (!results.length && parts.middle) {
    const r = await pool.query(`
      SELECT id, employee_code, first_name, middle_name, last_name, suffix, department, branch_id
      FROM employees
      WHERE LOWER(middle_name) = LOWER($1)
      LIMIT 5
    `, [parts.middle]);
    results.push(...r.rows);
  }

  // Search by first name only (for "show attendance of Allan")
  if (!results.length && parts.first && parts.first.length >= 2) {
    const r = await pool.query(`
      SELECT id, employee_code, first_name, middle_name, last_name, suffix, department, branch_id
      FROM employees
      WHERE LOWER(first_name) = LOWER($1)
      LIMIT 5
    `, [parts.first]);
    results.push(...r.rows);
  }

  // Search by any word match (last resort)
  if (!results.length) {
    const words = norm.split(/\s+/).filter(w => w.length >= 3);
    for (const word of words) {
      const r = await pool.query(`
        SELECT id, employee_code, first_name, middle_name, last_name, suffix, department, branch_id
        FROM employees
        WHERE LOWER(first_name) LIKE LOWER($1)
           OR LOWER(last_name) LIKE LOWER($1)
           OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER($1)
        LIMIT 5
      `, [`%${word}%`]);
      if (r.rows.length > 0) {
        results.push(...r.rows);
        break;
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
};

const findEmployeeByCode = async (code) => {
  const cleanCode = code.replace(/[- ]/g, "").toUpperCase();
  const result = await pool.query(`
    SELECT id, employee_code, first_name, middle_name, last_name, suffix, department, branch_id
    FROM employees
    WHERE LOWER(employee_code) = LOWER($1)
    LIMIT 1
  `, [cleanCode]);
  return result.rows[0] || null;
};

const detectEmployee = async (question) => {
  // Employee code patterns: EMP001, EMP-001
  const codeMatch = question.match(/\b(?:EMP[- ]?)(\d{3,})\b/i);
  if (codeMatch) {
    const emp = await findEmployeeByCode(codeMatch[0]);
    if (emp) return { employee: emp, multiple: false };
  }

  // Extract name from common patterns
  const nameCandidates = [];

  // Pattern: "of|for|by <Name>" anywhere
  let m;
  const prepPattern = /(?:of|for|by)\s+([A-Za-z][A-Za-z\s.'’,]+?)(?:\s+(?:yesterday|today|this\s+\w+|last\s+\w+|\d{4}-\d{2}-\d{2}|in\s+\w+|for\s+\w+))?$/i;
  m = question.match(prepPattern);
  if (m) {
    const candidate = m[1].trim();
    if (candidate.split(/\s+/).length >= 2 || candidate.length > 3) {
      nameCandidates.push(candidate);
    }
  }

  // Pattern: "show|view|get <noun> of|for <Name>"
  const actionPattern = /(?:show|get|view|check)\s+(?:\w+\s+)?(?:of|for)\s+([A-Za-z][A-Za-z\s.'’,]+)$/i;
  m = question.match(actionPattern);
  if (m) nameCandidates.push(m[1].trim());

  // Try each candidate
  for (const candidate of nameCandidates) {
    const exact = await findEmployeeByExactName(candidate);
    if (exact) return { employee: exact, multiple: false };

    const fuzzy = await findEmployeeByFuzzyName(candidate);
    if (fuzzy.length === 1) return { employee: fuzzy[0], multiple: false };
    if (fuzzy.length > 1) return { employee: fuzzy[0], multiple: true, candidates: fuzzy };
  }

  // Last resort: try to detect employee from last word patterns
  const bareNameMatch = question.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/);
  if (bareNameMatch) {
    const fullName = bareNameMatch[1];
    // Clean suffix
    const clean = fullName.replace(/,\s*(Sr\.?|Jr\.?|II|III|IV|V)$/i, "").trim();
    const exact = await findEmployeeByExactName(clean);
    if (exact) return { employee: exact, multiple: false };
  }

  return null;
};

// ========== BRANCH DETECTION ==========

const findBranchByName = async (name) => {
  const result = await pool.query(`
    SELECT id, code, name FROM branches
    WHERE LOWER(name) = LOWER($1)
       OR LOWER(code) = LOWER($1)
    LIMIT 1
  `, [name]);
  return result.rows[0] || null;
};

const detectBranch = async (question) => {
  const branchMatch = question.match(/(\w+(?:\s+\w+)?)\s*(?:branch|office)/i);
  if (branchMatch) {
    const branchName = branchMatch[1].trim();
    return await findBranchByName(branchName);
  }
  return null;
};

// ========== DEPARTMENT DETECTION ==========

const findDepartmentByName = async (name) => {
  const result = await pool.query(`
    SELECT DISTINCT department FROM employees
    WHERE LOWER(department) = LOWER($1)
       OR LOWER(REPLACE(department, ' ', '')) = LOWER(REPLACE($1, ' ', ''))
    LIMIT 1
  `, [name]);
  return result.rows[0] ? result.rows[0].department : null;
};

const detectDepartment = async (question) => {
  const deptMatch = question.match(/(\w+(?:\s+\w+)?)\s*(?:department|dept)/i);
  if (deptMatch) {
    const deptName = deptMatch[1].trim();
    return await findDepartmentByName(deptName);
  }

  const knownDepts = await pool.query(`SELECT DISTINCT department FROM employees WHERE department IS NOT NULL`);
  for (const row of knownDepts.rows) {
    const dept = row.department;
    if (new RegExp(`\\b${escapeRegex(dept)}\\b`, 'i').test(question)) {
      return dept;
    }
  }

  return null;
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ========== CUTOFF DETECTION ==========

const detectCutoff = async (timePeriod) => {
  if (timePeriod === "this_cutoff" || timePeriod === "last_cutoff") {
    const offset = timePeriod === "last_cutoff" ? 1 : 0;
    const result = await pool.query(`
      SELECT DISTINCT cutoff_start, cutoff_end FROM payroll
      WHERE status IN ('PAID', 'UNPAID')
      ORDER BY cutoff_end DESC
      LIMIT 1 OFFSET $1
    `, [offset]);
    if (result.rows[0]) {
      return {
        date_from: toDateStr(new Date(result.rows[0].cutoff_start)),
        date_to: toDateStr(new Date(result.rows[0].cutoff_end)),
        cutoff_label: `${toDateStr(new Date(result.rows[0].cutoff_start))} to ${toDateStr(new Date(result.rows[0].cutoff_end))}`,
      };
    }
  }
  return null;
};

// ========== MAIN ENTITY EXTRACTION ==========

const extractEntities = async (question, context) => {
  const entities = {};

  // 1. Detect time period
  const timePeriod = detectTimePeriod(question);
  if (timePeriod) {
    entities.date_from = timePeriod.date_from;
    entities.date_to = timePeriod.date_to;
  }

  // 2. Detect cutoff (overrides time period if matched)
  for (const { pattern, id } of TIME_KEYWORDS) {
    if (pattern.test(question) && (id === "this_cutoff" || id === "last_cutoff")) {
      const cutoff = await detectCutoff(id);
      if (cutoff) {
        entities.date_from = cutoff.date_from;
        entities.date_to = cutoff.date_to;
        entities.cutoff_label = cutoff.cutoff_label;
      }
      break;
    }
  }

  // 3. Detect employee
  const detected = await detectEmployee(question);
  if (detected) {
    const emp = detected.employee;
    entities.employeeId = emp.id;
    const midName = emp.middle_name ? ` ${emp.middle_name}` : "";
    const suffix = emp.suffix ? `, ${emp.suffix}` : "";
    entities.employeeName = `${emp.first_name}${midName} ${emp.last_name}${suffix}`;
    entities.employeeCode = emp.employee_code;
    entities.employeeDepartment = emp.department;
    entities.employeeBranchId = emp.branch_id;
    entities._multipleMatches = detected.multiple ? detected.candidates : null;
  }

  // 4. Detect branch
  const branch = await detectBranch(question);
  if (branch) {
    entities.branchId = branch.id;
    entities.branchName = branch.name;
  }

  // 5. Detect department
  const department = await detectDepartment(question);
  if (department) {
    entities.department = department;
  }

  // 6. Merge context (fill in missing entities — only if new question didn't detect anything in that category)
  // NEW entities ALWAYS take priority over old context
  if (context) {
    if (entities.employeeId === undefined && context.employeeId) {
      entities.employeeId = context.employeeId;
      entities.employeeName = context.employeeName;
      entities.employeeCode = context.employeeCode;
      entities.employeeDepartment = context.employeeDepartment;
      entities.employeeBranchId = context.employeeBranchId;
    }
    if (entities.branchId === undefined && context.branchId) {
      entities.branchId = context.branchId;
      entities.branchName = context.branchName;
    }
    if (entities.department === undefined && context.department) {
      entities.department = context.department;
    }
    if (entities.date_from === undefined && context.date_from) {
      entities.date_from = context.date_from;
      entities.date_to = context.date_to;
    }
  }

  return entities;
};

module.exports = {
  extractEntities,
  findEmployeeByExactName,
  findEmployeeByFuzzyName,
  findEmployeeByCode,
  findBranchByName,
  findDepartmentByName,
  detectTimePeriod,
  normalizeName,
};
