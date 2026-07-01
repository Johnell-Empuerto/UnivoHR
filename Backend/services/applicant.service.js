const applicantModel = require("../models/applicant.model");
const applicantInterviewModel = require("../models/applicantInterview.model");
const applicantApprovalModel = require("../models/applicantApproval.model");
const branchModel = require("../models/branch.model");
const employeeModel = require("../models/employee.model");
const { cleanPlainText } = require("../utils/inputSanitizer");
const pool = require("../config/db");
const leaveCreditModel = require("../models/leaveCredit.model");
const notificationService = require("./notification.service");
const { initializeNewEmployee } = require("./employeeInit.service");
const { EMPLOYMENT_STATUS, COMPANY_DEFAULT_PROBATION_MONTHS } = require("../constants/employmentStatus");
const applicantWorkflowService = require("./applicantWorkflow.service");
const logger = require("../utils/logger");

const hasApprovedHiringApproval = async (applicantId) => {
  const approvals = await applicantApprovalModel.getByApplicantId(applicantId);
  return approvals.some(a => a.decision === "APPROVED");
};

const evaluateCanConvertToEmployee = async (applicant) => {
  if (!applicant || applicant.employee_id) return false;
  if (!applicant.workflow_instance_id) return false;

  const instResult = await pool.query(
    `SELECT * FROM applicant_workflow_instances WHERE id = $1 AND applicant_id = $2`,
    [applicant.workflow_instance_id, applicant.id],
  );
  if (instResult.rows.length === 0) return false;
  const instance = instResult.rows[0];
  if (instance.status !== 'COMPLETED') return false;

  const stagesResult = await pool.query(
    `SELECT * FROM recruitment_workflow_stages WHERE workflow_id = $1 ORDER BY sequence_order DESC LIMIT 1`,
    [instance.workflow_id],
  );
  if (stagesResult.rows.length === 0) return false;
  const finalStage = stagesResult.rows[0];
  if (finalStage.stage_type !== 'CONVERT_TO_EMPLOYEE') return false;

  const recordResult = await pool.query(
    `SELECT * FROM applicant_stage_records
     WHERE applicant_id = $1 AND workflow_stage_id = $2
     ORDER BY id DESC LIMIT 1`,
    [applicant.id, finalStage.id],
  );
  if (recordResult.rows.length === 0) return false;
  const finalRecord = recordResult.rows[0];

  return (
    finalRecord.status === 'COMPLETED' &&
    ['PASSED', 'COMPLETED'].includes(finalRecord.recommendation || 'PASSED')
  );
};

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
  Promise.all(promises).catch(err => logger.error({ err }, "[RECRUITMENT] Notification error"));
};

const autoCreateStageRecords = async (applicantId, normalizedStatus) => {
  const s = (normalizedStatus || "").toUpperCase();

  let currentIdx;
  if (["APPROVED", "COMPLETED", "FOR_APPROVAL"].some(x => s.includes(x))) {
    currentIdx = 4;
  } else if (s.includes("FINAL")) {
    currentIdx = 3;
  } else if (s.includes("EXAM")) {
    currentIdx = 2;
  } else if (s.includes("INITIAL")) {
    currentIdx = 1;
  } else {
    currentIdx = 0;
  }

  const interviewLabels = ["Initial Interview", "Exam Interview", "Final Interview"];
  const existingInterviews = await applicantInterviewModel.getByApplicantId(applicantId);

  for (let i = 0; i < Math.min(currentIdx - 1, 3); i++) {
    if (!existingInterviews.some(iv => iv.interview_type === interviewLabels[i])) {
      await applicantInterviewModel.create({
        applicant_id: applicantId,
        interview_date: new Date(),
        interview_type: interviewLabels[i],
        status: "COMPLETED",
        notes: "Auto-created on stage progression",
      });
    }
  }

  if (currentIdx >= 4) {
    const existingApprovals = await applicantApprovalModel.getByApplicantId(applicantId);
    if (existingApprovals.length === 0) {
      await applicantApprovalModel.create({
        applicant_id: applicantId,
        approval_type: "HIRING",
        decision: "PENDING",
        comments: "Auto-created pending approval from stage progression",
      });
    }
  }
};

const repairApplicantStageRecords = async (applicantId) => {
  const applicant = await applicantModel.getById(applicantId);
  if (!applicant) throw new Error("Applicant not found");

  const isHired = !!applicant.employee_id;
  const rawStatus = (applicant.status || "").toUpperCase();

  let currentIdx;
  if (isHired) {
    currentIdx = 5;
  } else if (["APPROVED", "COMPLETED", "FOR_APPROVAL"].some(s => rawStatus.includes(s))) {
    currentIdx = 4;
  } else if (rawStatus.includes("FINAL")) {
    currentIdx = 3;
  } else if (rawStatus.includes("EXAM")) {
    currentIdx = 2;
  } else if (rawStatus.includes("INITIAL")) {
    currentIdx = 1;
  } else {
    currentIdx = 0;
  }

  const result = {
    applicant_id: applicantId,
    status: applicant.status,
    is_hired: isHired,
    stage_index: currentIdx,
    interviews_created: [],
    interviews_existing: [],
    approval_created: false,
    approval_existing: false,
  };

  const interviewLabels = ["Initial Interview", "Exam Interview", "Final Interview"];
  const existingInterviews = await applicantInterviewModel.getByApplicantId(applicantId);

  for (let i = 0; i < Math.min(currentIdx - 1, 3); i++) {
    const label = interviewLabels[i];
    if (existingInterviews.some(iv => iv.interview_type === label)) {
      result.interviews_existing.push(label);
    } else {
      await applicantInterviewModel.create({
        applicant_id: applicantId,
        interview_date: new Date(),
        interview_type: label,
        status: "COMPLETED",
        notes: "Created by stage record repair",
      });
      result.interviews_created.push(label);
    }
  }

  if (currentIdx >= 4) {
    const existingApprovals = await applicantApprovalModel.getByApplicantId(applicantId);
    if (existingApprovals.length > 0) {
      result.approval_existing = true;
    } else {
      await applicantApprovalModel.create({
        applicant_id: applicantId,
        approval_type: "HIRING",
        decision: "PENDING",
        comments: "Created as pending approval by stage record repair",
      });
      result.approval_created = true;
    }
  }

  return result;
};

const getAll = async (page, limit, search, status, jobPositionId) => {
  return await applicantModel.getAll(page, limit, search, status, jobPositionId);
};

const getById = async (id) => {
  const applicant = await applicantModel.getById(id);
  if (!applicant) throw new Error("Applicant not found");
  applicant.can_convert_to_employee = await evaluateCanConvertToEmployee(applicant);
  return applicant;
};

const create = async (data) => {
  if (!data.first_name || !data.first_name.trim()) throw new Error("First name is required");
  if (!data.last_name || !data.last_name.trim()) throw new Error("Last name is required");
  data.status = normalizeApplicantStatus(data.status);

  let preResolved = null;
  if (data.job_position_id) {
    preResolved = await applicantWorkflowService.resolveWorkflowForCreation(data.job_position_id);
  }

  if (!preResolved) {
    const defaultWf = await applicantWorkflowService.resolveDefaultWorkflow();
    if (defaultWf) {
      const stages = await applicantWorkflowService.getStagesForWorkflow(defaultWf.id);
      if (stages && stages.length > 0) {
        preResolved = { workflow: defaultWf, stages };
      }
    }
  }

  if (!preResolved) {
    if (data.job_position_id) {
      throw new Error(
        "No recruitment workflow assigned to this job position and no default active workflow configured. Please assign a workflow to this job position or configure a default workflow.",
      );
    }
    throw new Error(
      "No job position selected and no default active workflow configured. Please select a job position with a workflow or configure a default workflow.",
    );
  }

  logger.info(
    `[RECRUITMENT] Workflow resolved for applicant creation: "${preResolved.workflow.name}" (id=${preResolved.workflow.id}) with ${preResolved.stages.length} stages`,
  );

  if (data.address) data.address = cleanPlainText(data.address);
  if (data.notes) data.notes = cleanPlainText(data.notes);

  const applicant = await applicantModel.create(data);

  applicantModel.getActiveHRUserIds().then(userIds => {
    notifyParty(userIds, "New Applicant Registration", `${applicant.first_name} ${applicant.last_name} registered as applicant`, applicant.id);
  });

  try {
    await applicantWorkflowService.autoInitializeWorkflow(applicant, preResolved);
    logger.info(
      `[RECRUITMENT] Workflow initialized for applicant #${applicant.id} using "${preResolved.workflow.name}"`,
    );
  } catch (err) {
    logger.error({ err }, `[RECRUITMENT] Workflow init error for applicant #${applicant.id}`);
  }

  const result = await applicantModel.getById(applicant.id);
  return result || applicant;
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
    address: data.address !== undefined ? cleanPlainText(data.address) : existing.address,
    resume_url: data.resume_url !== undefined ? data.resume_url : existing.resume_url,
    status: normalizeApplicantStatus(data.status !== undefined ? data.status : existing.status),
    rating: data.rating !== undefined ? data.rating : existing.rating,
    source: data.source !== undefined ? data.source : existing.source,
    notes: data.notes !== undefined ? cleanPlainText(data.notes) : existing.notes,
    applied_date: data.applied_date !== undefined ? data.applied_date : existing.applied_date,
  };
  if (data.status !== undefined) {
    const newNormalized = normalizeApplicantStatus(data.status);
    const oldNormalized = normalizeApplicantStatus(existing.status);
    if (newNormalized === "Completed" && oldNormalized !== "Completed" && !(await hasApprovedHiringApproval(id))) {
      throw new Error("Applicant requires an approved hiring approval before marking as Completed.");
    }
  }
  const updated = await applicantModel.update(id, merged);
  if (merged.status !== existing.status) {
    autoCreateStageRecords(id, merged.status).catch(err =>
      logger.error({ err }, "[RECRUITMENT] Auto-create stage records error")
    );
  }
  return updated;
};

const updateStatus = async (id, status) => {
  const existing = await applicantModel.getById(id);
  if (!existing) throw new Error("Applicant not found");
  const normalized = normalizeApplicantStatus(status);
  if (existing.status === normalized) return existing;
  const existingNormalized = normalizeApplicantStatus(existing.status);
  if (normalized === "Completed" && existingNormalized !== "Completed" && !(await hasApprovedHiringApproval(id))) {
    throw new Error("Applicant requires an approved hiring approval before marking as Completed.");
  }
  const updated = await applicantModel.updateStatus(id, normalized);
  autoCreateStageRecords(id, normalized).catch(err =>
    logger.error({ err }, "[RECRUITMENT] Auto-create stage records error")
  );
  applicantModel.getActiveHRUserIds().then(userIds => {
    notifyParty(userIds, "Applicant Status Updated", `${existing.first_name} ${existing.last_name} status changed to ${status}`, updated.id);
  });
  return updated;
};

const remove = async (id) => {
  const existing = await applicantModel.getById(id);
  if (!existing) throw new Error("Applicant not found");
  if (existing.employee_id) {
    throw new Error("Cannot delete applicant that has already been converted to an employee. Deactivate the employee record instead.");
  }
  if (existing.workflow_instance_id) {
    throw new Error("Cannot delete applicant with active or completed workflow history. Archive the applicant instead.");
  }
  const relatedCounts = await applicantModel.getRelatedCounts(id);
  if (relatedCounts.interviews > 0 || relatedCounts.approvals > 0 ||
      relatedCounts.family > 0 || relatedCounts.education > 0 || relatedCounts.experience > 0) {
    throw new Error("Cannot delete applicant with existing interview, approval, or biodata records. Archive the applicant instead.");
  }
  return await applicantModel.remove(id);
};

const convertToEmployee = async (applicantId, additionalData) => {
  const applicant = await applicantModel.getById(applicantId);
  if (!applicant) throw new Error("Applicant not found");
  if (applicant.employee_id) throw new Error("This applicant has already been converted to an employee.");

  const canConvertViaDynamic = await evaluateCanConvertToEmployee(applicant);
  if (!canConvertViaDynamic) {
    if (applicant.status !== "Completed") {
      throw new Error("Applicant status must be Completed before converting to employee");
    }
    if (!(await hasApprovedHiringApproval(applicantId))) {
      throw new Error("Applicant requires an approved hiring approval before conversion to employee.");
    }
  }

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

      autoCreateStageRecords(applicantId, "Completed").catch(err =>
        logger.error({ err }, "[RECRUITMENT] Auto-create stage records error")
      );

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

    let generatedCode = null;
    let employeeCode;
    if (additionalData.employee_code) {
      employeeCode = additionalData.employee_code;
    } else {
      const gen = await generateEmployeeCode(client);
      employeeCode = gen.code;
      generatedCode = gen.number;
    }

    const employeeData = {
      first_name: applicant.first_name,
      middle_name: applicant.middle_name,
      last_name: applicant.last_name,
      suffix: applicant.suffix,
      employee_code: employeeCode,
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

    await initializeNewEmployee(newEmployee.id, client);

    await client.query(
      `UPDATE applicants SET employee_id = $1, updated_at = NOW() WHERE id = $2`,
      [newEmployee.id, applicantId],
    );

    // Copy applicant biodata → employee biodata
    const familyRows = await client.query(
      "SELECT * FROM applicant_family_members WHERE applicant_id = $1",
      [applicantId],
    );
    for (const m of familyRows.rows) {
      await client.query(
        `INSERT INTO employee_family_members
         (employee_id, relationship_type, full_name, birthdate, occupation, contact_number, address, is_dependent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [newEmployee.id, m.relationship_type, m.full_name,
         m.birthdate, m.occupation, m.contact_number, m.address, m.is_dependent],
      );
    }

    const eduRows = await client.query(
      "SELECT * FROM applicant_education WHERE applicant_id = $1",
      [applicantId],
    );
    for (const e of eduRows.rows) {
      await client.query(
        `INSERT INTO employee_education
         (employee_id, education_level, school_name, course_or_degree, year_started, year_graduated, honors_awards)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [newEmployee.id, e.education_level, e.school_name,
         e.course_or_degree, e.year_started, e.year_graduated, e.honors_awards],
      );
    }

    const expRows = await client.query(
      "SELECT * FROM applicant_work_experience WHERE applicant_id = $1",
      [applicantId],
    );
    for (const x of expRows.rows) {
      await client.query(
        `INSERT INTO employee_work_experience
         (employee_id, company_name, position, start_date, end_date, reason_for_leaving)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [newEmployee.id, x.company_name, x.position,
         x.start_date, x.end_date, x.reason_for_leaving],
      );
    }

    await client.query("COMMIT");

    if (generatedCode !== null) {
      await pool.query(
        `UPDATE system_settings SET value = $1, updated_at = NOW() WHERE key = 'employee_code_counter'`,
        [String(generatedCode)],
      );
    }

    autoCreateStageRecords(applicantId, "Completed").catch(err =>
      logger.error({ err }, "[RECRUITMENT] Auto-create stage records error")
    );

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

const getEmployeeCodeSettings = async (db) => {
  const result = await db.query(
    `SELECT key, value FROM system_settings WHERE key = ANY($1)`,
    [['employee_code_auto_generate', 'employee_code_prefix', 'employee_code_separator', 'employee_code_padding', 'employee_code_counter']],
  );
  const settings = { prefix: 'EMP', separator: '', padding: '4', counter: '0', autoGenerate: 'true' };
  result.rows.forEach(r => {
    switch (r.key) {
      case 'employee_code_prefix': settings.prefix = r.value; break;
      case 'employee_code_separator': settings.separator = r.value; break;
      case 'employee_code_padding': settings.padding = r.value; break;
      case 'employee_code_counter': settings.counter = r.value; break;
      case 'employee_code_auto_generate': settings.autoGenerate = r.value; break;
    }
  });
  return settings;
};

const generateEmployeeCode = async (client) => {
  const db = client || pool;
  const settings = await getEmployeeCodeSettings(db);

  if (settings.autoGenerate !== 'true') {
    throw new Error('Auto-generation is disabled. Please provide an employee code manually.');
  }

  const prefix = typeof settings.prefix === 'string' ? settings.prefix : 'EMP';
  const separator = settings.separator || '';
  const padding = Math.max(0, parseInt(settings.padding) || 4);
  const counter = Math.max(0, parseInt(settings.counter) || 0);

  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedSep = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = `^${escapedPrefix}${escapedSep}[0-9]+$`;

  const result = await db.query(
    `SELECT employee_code FROM employees
     WHERE employee_code ~ $1
     ORDER BY CAST(SUBSTRING(employee_code FROM $2) AS INTEGER) DESC LIMIT 1`,
    [pattern, prefix.length + separator.length + 1],
  );

  let nextNumber = counter + 1;

  if (result.rows.length > 0) {
    const numStr = result.rows[0].employee_code.slice(prefix.length + separator.length);
    const num = parseInt(numStr, 10);
    if (!isNaN(num)) nextNumber = Math.max(nextNumber, num + 1);
  }

  let code;
  while (true) {
    code = `${prefix}${separator}${String(nextNumber).padStart(padding, '0')}`;
    const exists = await db.query(
      'SELECT id FROM employees WHERE employee_code = $1 LIMIT 1',
      [code],
    );
    if (exists.rows.length === 0) break;
    nextNumber++;
  }

  return { code, number: nextNumber };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  remove,
  convertToEmployee,
  generateEmployeeCode,
  getEmployeeCodeSettings,
  autoCreateStageRecords,
  repairApplicantStageRecords,
  hasApprovedHiringApproval,
  evaluateCanConvertToEmployee,
};
