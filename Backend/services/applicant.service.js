const applicantModel = require("../models/applicant.model");
const branchModel = require("../models/branch.model");
const employeeModel = require("../models/employee.model");
const pool = require("../config/db");
const leaveCreditModel = require("../models/leaveCredit.model");
const notificationService = require("./notification.service");
const { EMPLOYMENT_STATUS, COMPANY_DEFAULT_PROBATION_MONTHS } = require("../constants/employmentStatus");

const normalizeApplicantStatus = (status) => {
  if (!status) return "Initial";
  const map = {
    NEW: "Initial",
    SCREENING: "Initial",
    SHORTLISTED: "Pending",
    FOR_INTERVIEW: "Final Interview",
    FOR_APPROVAL: "Pending",
    APPROVED: "Completed",
    HIRED: "Completed",
    REJECTED: "Fail",
    WITHDRAWN: "Fail",
  };
  return map[status] || status;
};

const notifyParty = (userIds, title, message, referenceId) => {
  if (userIds.length === 0) return;
  const promises = userIds.map(id =>
    notificationService.notify({ user_id: id, type: "RECRUITMENT", title, message, reference_id: referenceId })
  );
  Promise.all(promises).catch(err => console.error("[RECRUITMENT] Notification error:", err));
};

const getAll = async (page, limit, search, status, jobPositionId) => {
  return await applicantModel.getAll(page, limit, search, status, jobPositionId);
};

const getById = async (id) => {
  const applicant = await applicantModel.getById(id);
  if (!applicant) throw new Error("Applicant not found");
  return applicant;
};

const create = async (data) => {
  if (!data.first_name || !data.first_name.trim()) throw new Error("First name is required");
  if (!data.last_name || !data.last_name.trim()) throw new Error("Last name is required");
  data.status = normalizeApplicantStatus(data.status);
  const applicant = await applicantModel.create(data);
  applicantModel.getActiveHRUserIds().then(userIds => {
    notifyParty(userIds, "New Applicant Registration", `${applicant.first_name} ${applicant.last_name} registered as applicant`, applicant.id);
  });
  return applicant;
};

const update = async (id, data) => {
  const existing = await applicantModel.getById(id);
  if (!existing) throw new Error("Applicant not found");
  const merged = {
    job_position_id: data.job_position_id !== undefined ? data.job_position_id : existing.job_position_id,
    first_name: data.first_name !== undefined ? data.first_name : existing.first_name,
    middle_name: data.middle_name !== undefined ? data.middle_name : existing.middle_name,
    last_name: data.last_name !== undefined ? data.last_name : existing.last_name,
    suffix: data.suffix !== undefined ? data.suffix : existing.suffix,
    email: data.email !== undefined ? data.email : existing.email,
    phone: data.phone !== undefined ? data.phone : existing.phone,
    address: data.address !== undefined ? data.address : existing.address,
    resume_url: data.resume_url !== undefined ? data.resume_url : existing.resume_url,
    status: normalizeApplicantStatus(data.status !== undefined ? data.status : existing.status),
    rating: data.rating !== undefined ? data.rating : existing.rating,
    source: data.source !== undefined ? data.source : existing.source,
    notes: data.notes !== undefined ? data.notes : existing.notes,
    applied_date: data.applied_date !== undefined ? data.applied_date : existing.applied_date,
  };
  return await applicantModel.update(id, merged);
};

const updateStatus = async (id, status) => {
  const existing = await applicantModel.getById(id);
  if (!existing) throw new Error("Applicant not found");
  const normalized = normalizeApplicantStatus(status);
  const updated = await applicantModel.updateStatus(id, normalized);
  applicantModel.getActiveHRUserIds().then(userIds => {
    notifyParty(userIds, "Applicant Status Updated", `${existing.first_name} ${existing.last_name} status changed to ${status}`, updated.id);
  });
  return updated;
};

const remove = async (id) => {
  const existing = await applicantModel.getById(id);
  if (!existing) throw new Error("Applicant not found");
  return await applicantModel.remove(id);
};

const convertToEmployee = async (applicantId, additionalData) => {
  const applicant = await applicantModel.getById(applicantId);
  if (!applicant) throw new Error("Applicant not found");
  if (applicant.status !== "Completed") throw new Error("Applicant status must be Completed before converting to employee");
  if (applicant.employee_id) throw new Error("This applicant has already been converted to an employee.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const matchResult = await client.query(
      `SELECT id, employee_code, first_name, last_name
       FROM employees
       WHERE first_name IS NOT DISTINCT FROM $1
         AND middle_name IS NOT DISTINCT FROM $2
         AND last_name IS NOT DISTINCT FROM $3
         AND suffix IS NOT DISTINCT FROM $4
       LIMIT 1`,
      [applicant.first_name, applicant.middle_name, applicant.last_name, applicant.suffix],
    );

    if (matchResult.rows.length > 0) {
      const existing = matchResult.rows[0];
      await client.query(
        `UPDATE applicants SET employee_id = $1, updated_at = NOW() WHERE id = $2`,
        [existing.id, applicantId],
      );
      await client.query("COMMIT");
      applicantModel.getActiveHRUserIds().then(userIds => {
        notifyParty(userIds, "Applicant Hired", `${applicant.first_name} ${applicant.last_name} linked to existing employee ${existing.employee_code}`, applicantId);
      });
      return {
        id: existing.id,
        employee_code: existing.employee_code,
        first_name: existing.first_name,
        last_name: existing.last_name,
        linked: true,
        message: "Applicant was already converted before. Existing employee has been linked.",
      };
    }

    let branchId = additionalData.branch_id || null;
    if (!branchId && additionalData.branch_code) {
      const branch = await branchModel.getByCode(additionalData.branch_code);
      branchId = branch ? branch.id : null;
    }

    const probationMonths = additionalData.probation_period_months != null
      ? Number(additionalData.probation_period_months)
      : COMPANY_DEFAULT_PROBATION_MONTHS;

    const hiredDate = additionalData.hired_date || new Date().toISOString().split("T")[0];
    let regularizationDate = null;
    if (probationMonths > 0 && hiredDate) {
      const regDate = new Date(hiredDate);
      regDate.setMonth(regDate.getMonth() + probationMonths);
      regularizationDate = regDate.toISOString().split("T")[0];
    }

    const employeeData = {
      first_name: applicant.first_name,
      middle_name: applicant.middle_name,
      last_name: applicant.last_name,
      suffix: applicant.suffix,
      employee_code: additionalData.employee_code || (await generateEmployeeCode(client)),
      department: applicant.job_department || additionalData.department || null,
      position: applicant.job_title || additionalData.position || null,
      contact_number: applicant.phone || null,
      address: applicant.address || null,
      email: applicant.email || null,
      hired_date: hiredDate,
      status: "ACTIVE",
      branch_id: branchId,
      employment_status: EMPLOYMENT_STATUS.PROBATIONARY,
      probation_period_months: probationMonths > 0 ? probationMonths : null,
      regularization_date: regularizationDate,
    };

    const empResult = await client.query(
      `INSERT INTO employees (
        first_name, middle_name, last_name, suffix,
        employee_code, department, position,
        contact_number, address, email,
        hired_date, status, branch_id, employment_status,
        probation_period_months, regularization_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING id, employee_code, first_name, last_name`,
      [
        employeeData.first_name,
        employeeData.middle_name || null,
        employeeData.last_name,
        employeeData.suffix || null,
        employeeData.employee_code,
        employeeData.department || null,
        employeeData.position || null,
        employeeData.contact_number || null,
        employeeData.address || null,
        employeeData.email || null,
        employeeData.hired_date,
        employeeData.status,
        employeeData.branch_id || null,
        employeeData.employment_status,
        employeeData.probation_period_months,
        employeeData.regularization_date,
      ],
    );

    const newEmployee = empResult.rows[0];

    if (!newEmployee || !newEmployee.id) {
      throw new Error("Employee was created but employee ID was not returned.");
    }

    await leaveCreditModel.createDefault(newEmployee.id, client);

    await client.query(
      `UPDATE applicants SET employee_id = $1, updated_at = NOW() WHERE id = $2`,
      [newEmployee.id, applicantId],
    );

    await client.query("COMMIT");
    applicantModel.getActiveHRUserIds().then(userIds => {
      notifyParty(userIds, "Applicant Hired", `${applicant.first_name} ${applicant.last_name} has been hired as ${newEmployee.employee_code}`, applicantId);
    });
    return newEmployee;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const generateEmployeeCode = async (client) => {
  const db = client || pool;
  const result = await db.query(
    `SELECT employee_code
     FROM employees
     WHERE employee_code ~ '^EMP[0-9]+$'
     ORDER BY CAST(SUBSTRING(employee_code FROM 4) AS INTEGER) DESC
     LIMIT 1`,
  );

  let nextNumber = 1;
  if (result.rows.length > 0) {
    const lastCode = result.rows[0].employee_code;
    const match = lastCode.match(/^EMP(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  let code;
  while (true) {
    code = `EMP${String(nextNumber).padStart(4, "0")}`;
    const exists = await db.query(
      "SELECT id FROM employees WHERE employee_code = $1 LIMIT 1",
      [code],
    );
    if (exists.rows.length === 0) break;
    nextNumber++;
  }

  return code;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  remove,
  convertToEmployee,
};
