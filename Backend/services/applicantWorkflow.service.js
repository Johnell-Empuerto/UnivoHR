const pool = require("../config/db");
const notificationService = require("./notification.service");

const notifyHRUsers = (title, message, reference_id) => {
  pool.query(
    `SELECT id FROM users WHERE role = 'ADMIN' OR EXISTS (
      SELECT 1 FROM user_permissions up WHERE up.user_id = users.id AND up.permission_key = 'employees.manage' AND up.is_allowed = true
    )`
  ).then((r) => {
    for (const u of r.rows) {
      notificationService.notify({ user_id: u.id, type: "RECRUITMENT", title, message, reference_id }).catch(() => {});
    }
  }).catch(() => {});
};

const resolveWorkflowForApplicant = async (jobPositionId) => {
  if (!jobPositionId) {
    console.warn("[applicantWorkflow] No job_position_id provided");
    return null;
  }

  const result = await pool.query(
    `SELECT rw.*
     FROM job_positions jp
     INNER JOIN recruitment_workflows rw ON rw.id = jp.workflow_id
     WHERE jp.id = $1 AND rw.is_active = TRUE
     LIMIT 1`,
    [jobPositionId],
  );

  if (result.rows.length === 0) {
    console.warn(
      `[applicantWorkflow] No active workflow found for job_position_id=${jobPositionId}`,
    );
    return null;
  }

  return result.rows[0];
};

const resolveDefaultWorkflow = async () => {
  const result = await pool.query(
    `SELECT * FROM recruitment_workflows WHERE is_default = TRUE AND is_active = TRUE LIMIT 1`,
  );
  return result.rows[0] || null;
};

const resolveWorkflowForCreation = async (jobPositionId) => {
  if (!jobPositionId) {
    throw new Error("No job position selected. Please select a job position to continue.");
  }

  const jpResult = await pool.query(
    `SELECT jp.workflow_id, jp.title FROM job_positions jp WHERE jp.id = $1`,
    [jobPositionId],
  );
  if (jpResult.rows.length === 0) {
    throw new Error("Selected job position not found.");
  }

  const jp = jpResult.rows[0];
  let workflow = null;

  if (jp.workflow_id) {
    const wfResult = await pool.query(
      `SELECT * FROM recruitment_workflows WHERE id = $1 AND is_active = TRUE LIMIT 1`,
      [jp.workflow_id],
    );
    if (wfResult.rows.length > 0) {
      workflow = wfResult.rows[0];
    } else {
      throw new Error(
        `Job position "${jp.title}" has a workflow assigned but it is inactive. Please activate the workflow or assign a different one.`,
      );
    }
  }

  if (!workflow) {
    workflow = await resolveDefaultWorkflow();
  }

  if (!workflow) {
    throw new Error(
      `No recruitment workflow assigned to "${jp.title}" and no default active workflow configured. Please assign a workflow to this job position or configure a default workflow.`,
    );
  }

  const stages = await getStagesForWorkflow(workflow.id);
  if (!stages || stages.length === 0) {
    throw new Error(
      `Workflow "${workflow.name}" has no stages configured. Please add stages to the workflow before creating applicants.`,
    );
  }

  return { workflow, stages };
};

const getStagesForWorkflow = async (workflowId) => {
  const result = await pool.query(
    `SELECT * FROM recruitment_workflow_stages
     WHERE workflow_id = $1
     ORDER BY sequence_order ASC`,
    [workflowId],
  );
  return result.rows;
};

const createWorkflowInstanceForApplicant = async (applicantId, workflow, stages) => {
  if (!stages || stages.length === 0) {
    console.warn(
      `[applicantWorkflow] Workflow ${workflow.id} has no stages — skipping instance creation for applicant ${applicantId}`,
    );
    return null;
  }

  const firstStage = stages[0];

  const snapshot = JSON.stringify({
    workflow: {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      is_default: workflow.is_default,
      is_active: workflow.is_active,
      version: workflow.version,
    },
    stages: stages.map((s) => ({
      id: s.id,
      stage_name: s.stage_name,
      stage_type: s.stage_type,
      sequence_order: s.sequence_order,
      is_required: s.is_required,
      requires_assignment: s.requires_assignment,
      requires_score: s.requires_score,
      requires_approval: s.requires_approval,
      passing_score: s.passing_score,
      allow_skip: s.allow_skip,
      auto_proceed_on_pass: s.auto_proceed_on_pass,
      days_to_complete: s.days_to_complete,
      is_terminal: s.is_terminal,
    })),
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const instanceResult = await client.query(
      `INSERT INTO applicant_workflow_instances
       (applicant_id, workflow_id, current_stage_id, status, workflow_snapshot)
       VALUES ($1, $2, $3, 'ACTIVE', $4::jsonb)
       RETURNING *`,
      [applicantId, workflow.id, firstStage.id, snapshot],
    );
    const instance = instanceResult.rows[0];

    await client.query(
      `INSERT INTO applicant_stage_records
       (applicant_id, workflow_instance_id, workflow_stage_id,
        stage_name, stage_type, status, is_current)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        applicantId,
        instance.id,
        firstStage.id,
        firstStage.stage_name,
        firstStage.stage_type,
        "PENDING",
        true,
      ],
    );

    await client.query(
      `UPDATE applicants SET workflow_instance_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [instance.id, applicantId],
    );

    await client.query("COMMIT");

    console.log(
      `[applicantWorkflow] Instance ${instance.id} created for applicant ${applicantId} with workflow ${workflow.id}`,
    );
    return instance;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      `[applicantWorkflow] Failed to create workflow instance for applicant ${applicantId}: ${error.message}`,
    );
    return null;
  } finally {
    client.release();
  }
};

const autoInitializeWorkflow = async (applicant, preResolved) => {
  if (!applicant || !applicant.id) return applicant;

  if (preResolved) {
    const instance = await createWorkflowInstanceForApplicant(
      applicant.id,
      preResolved.workflow,
      preResolved.stages,
    );
    if (instance) {
      applicant.workflow_instance_id = instance.id;
    }
    return applicant;
  }

  if (!applicant.job_position_id) return applicant;

  try {
    const workflow = await resolveWorkflowForApplicant(applicant.job_position_id);
    if (!workflow) return applicant;

    const stages = await getStagesForWorkflow(workflow.id);
    if (!stages || stages.length === 0) {
      console.warn(
        `[applicantWorkflow] Workflow ${workflow.id} has no stages — skipping applicant ${applicant.id}`,
      );
      return applicant;
    }

    const instance = await createWorkflowInstanceForApplicant(
      applicant.id,
      workflow,
      stages,
    );
    if (instance) {
      applicant.workflow_instance_id = instance.id;
    }
  } catch (error) {
    console.error(
      `[applicantWorkflow] autoInitializeWorkflow error for applicant ${applicant.id}: ${error.message}`,
    );
  }

  return applicant;
};

const getApplicantWorkflowTimeline = async (applicantId) => {
  const applicantResult = await pool.query(
    `SELECT a.*, rw.name AS workflow_name
     FROM applicants a
     LEFT JOIN applicant_workflow_instances awi ON awi.id = a.workflow_instance_id
     LEFT JOIN recruitment_workflows rw ON rw.id = awi.workflow_id
     WHERE a.id = $1`,
    [applicantId],
  );
  if (applicantResult.rows.length === 0) {
    return { mode: "LEGACY" };
  }

  const applicant = applicantResult.rows[0];
  if (!applicant.workflow_instance_id) {
    return { mode: "LEGACY" };
  }

  const instanceResult = await pool.query(
    `SELECT * FROM applicant_workflow_instances WHERE id = $1`,
    [applicant.workflow_instance_id],
  );
  if (instanceResult.rows.length === 0) {
    return { mode: "LEGACY" };
  }

  const instance = instanceResult.rows[0];

  const stagesResult = await pool.query(
    `SELECT
       rws.id AS workflow_stage_id,
       rws.sequence_order,
       rws.stage_name,
       rws.stage_type,
       rws.stage_category,
       rws.is_required,
       rws.requires_assignment,
       rws.requires_score,
        rws.requires_approval,
        rws.is_terminal,
        rws.passing_score,
        rws.allow_skip,
       asr.id AS stage_record_id,
       asr.status AS stage_record_status,
       asr.is_current,
       asr.score,
       asr.recommendation,
       asr.comments,
       asr.scheduled_at,
       asr.completed_at,
        asr.assigned_user_id,
        asr.assigned_employee_id,
         COALESCE(e1.first_name, e2.first_name) AS assigned_first_name,
         COALESCE(e1.last_name, e2.last_name) AS assigned_last_name,
         u.username AS assigned_username,
         COALESCE(e1.employee_code, e2.employee_code) AS assigned_employee_code,
        asa.id AS approval_id,
        asa.decision AS approval_decision,
        asa.comments AS approval_comments,
        asa.decided_at AS approval_decided_at,
        asa.approver_employee_id,
        asa.assigned_user_id AS approval_assigned_user_id,
        asa.assigned_employee_id AS approval_assigned_employee_id,
        asa.scheduled_at AS approval_scheduled_at,
        asa.assigned_at AS approval_assigned_at,
        asa.assigned_by AS approval_assigned_by,
        e3.first_name AS approval_approver_first_name,
        e3.last_name AS approval_approver_last_name,
        COALESCE(e4.first_name, e5.first_name) AS approval_assignee_first_name,
        COALESCE(e4.last_name, e5.last_name) AS approval_assignee_last_name,
        e6.first_name AS approval_assigned_by_first_name,
        e6.last_name AS approval_assigned_by_last_name
     FROM applicant_workflow_instances awi
     JOIN recruitment_workflows rw ON rw.id = awi.workflow_id
     JOIN recruitment_workflow_stages rws ON rws.workflow_id = awi.workflow_id
     LEFT JOIN LATERAL (
       SELECT * FROM applicant_stage_records asr2
       WHERE asr2.workflow_stage_id = rws.id AND asr2.workflow_instance_id = awi.id
       ORDER BY asr2.id DESC LIMIT 1
     ) asr ON TRUE
     LEFT JOIN users u ON u.id = asr.assigned_user_id
     LEFT JOIN employees e1 ON e1.id = u.employee_id
      LEFT JOIN employees e2 ON e2.id = asr.assigned_employee_id
      LEFT JOIN applicant_stage_approvals asa ON asa.stage_record_id = asr.id
      LEFT JOIN employees e3 ON e3.id = asa.approver_employee_id
      LEFT JOIN users u4 ON u4.id = asa.assigned_user_id
      LEFT JOIN employees e4 ON e4.id = u4.employee_id
      LEFT JOIN employees e5 ON e5.id = asa.assigned_employee_id
      LEFT JOIN users u6 ON u6.id = asa.assigned_by
      LEFT JOIN employees e6 ON e6.id = u6.employee_id
     WHERE awi.applicant_id = $1
     ORDER BY rws.sequence_order ASC`,
    [applicantId],
  );

  const stages = stagesResult.rows.map((row) => ({
    workflow_stage_id: row.workflow_stage_id,
    stage_record_id: row.stage_record_id,
    sequence_order: row.sequence_order,
    stage_name: row.stage_name,
    stage_type: row.stage_type,
    stage_category: row.stage_category,
    status: row.stage_record_status || "PENDING",
    is_current: row.is_current || false,
    score: row.score,
    recommendation: row.recommendation,
    comments: row.comments,
    scheduled_at: row.scheduled_at,
    completed_at: row.completed_at,
    assigned_user_id: row.assigned_user_id,
    assigned_employee_id: row.assigned_employee_id,
    assigned_name:
      row.assigned_first_name
        ? `${row.assigned_first_name} ${row.assigned_last_name || ""}`.trim()
        : row.assigned_username
          ? row.assigned_username
          : row.assigned_employee_code
            ? row.assigned_employee_code
            : row.assigned_user_id
              ? `User #${row.assigned_user_id}`
              : null,
    requires_assignment: row.requires_assignment,
    requires_score: row.requires_score,
    requires_approval: row.requires_approval,
    is_required: row.is_required,
    is_terminal: row.is_terminal,
    passing_score: row.passing_score,
    allow_skip: row.allow_skip,
    approval_decision: row.approval_decision,
    approval_comments: row.approval_comments,
    approval_decided_at: row.approval_decided_at,
    approval_approver_name:
      row.approval_approver_first_name
        ? `${row.approval_approver_first_name} ${row.approval_approver_last_name || ""}`.trim()
        : null,
    approval_assigned_user_id: row.approval_assigned_user_id,
    approval_assigned_employee_id: row.approval_assigned_employee_id,
    approval_scheduled_at: row.approval_scheduled_at,
    approval_assigned_at: row.approval_assigned_at,
    approval_assigned_by_name:
      row.approval_assigned_by_first_name
        ? `${row.approval_assigned_by_first_name} ${row.approval_assigned_by_last_name || ""}`.trim()
        : null,
    approval_assignee_name:
      row.approval_assignee_first_name
        ? `${row.approval_assignee_first_name} ${row.approval_assignee_last_name || ""}`.trim()
        : null,
  }));

  return {
    mode: "DYNAMIC",
    applicant_id: applicant.id,
    workflow_instance_id: instance.id,
    workflow_id: instance.workflow_id,
    workflow_name: applicant.workflow_name,
    current_stage_id: instance.current_stage_id,
    instance_status: instance.status,
    started_at: instance.started_at,
    completed_at: instance.completed_at,
    stages,
  };
};

const getStageRecordById = async (stageRecordId) => {
  const result = await pool.query(
    `SELECT asr.*, rws.requires_score, rws.requires_assignment, rws.requires_approval,
            rws.is_terminal, rws.passing_score, rws.allow_skip, rws.workflow_id,
            awi.applicant_id, awi.status AS instance_status,
            a.first_name, a.last_name
     FROM applicant_stage_records asr
     JOIN recruitment_workflow_stages rws ON rws.id = asr.workflow_stage_id
     JOIN applicant_workflow_instances awi ON awi.id = asr.workflow_instance_id
     JOIN applicants a ON a.id = asr.applicant_id
     WHERE asr.id = $1`,
    [stageRecordId],
  );
  return result.rows[0] || null;
};

const createStageRecord = async (applicantId, workflowStageId, data = {}) => {
  const applicantResult = await pool.query(
    `SELECT a.id, a.workflow_instance_id, rws.workflow_id, rws.stage_name, rws.stage_type,
            rws.requires_score, rws.requires_assignment, rws.requires_approval,
            rws.is_terminal, rws.passing_score, rws.allow_skip
     FROM applicants a
     JOIN recruitment_workflow_stages rws ON rws.id = $2
     LEFT JOIN applicant_workflow_instances awi ON awi.id = a.workflow_instance_id
     WHERE a.id = $1`,
    [applicantId, workflowStageId],
  );
  if (applicantResult.rows.length === 0) throw new Error("Applicant or workflow stage not found");
  const info = applicantResult.rows[0];
  if (!info.workflow_instance_id) throw new Error("Applicant does not have a workflow instance");

  const existing = await pool.query(
    `SELECT id FROM applicant_stage_records
     WHERE workflow_instance_id = $1 AND workflow_stage_id = $2
     LIMIT 1`,
    [info.workflow_instance_id, workflowStageId],
  );
  if (existing.rows.length > 0) {
    const sets = [];
    const vals = [];
    let idx = 1;
    if (data.assigned_user_id) { sets.push(`assigned_user_id = $${idx++}`); vals.push(data.assigned_user_id); }
    if (data.assigned_employee_id) { sets.push(`assigned_employee_id = $${idx++}`); vals.push(data.assigned_employee_id); }
    if (data.scheduled_at) { sets.push(`scheduled_at = $${idx++}`); vals.push(data.scheduled_at); }
    if (data.comments !== undefined) { sets.push(`comments = $${idx++}`); vals.push(data.comments); }
    if (data.status) { sets.push(`status = $${idx++}`); vals.push(data.status); }
    if (sets.length === 0) throw new Error("No fields to update");
    sets.push(`updated_at = NOW()`);
    vals.push(existing.rows[0].id);
    const result = await pool.query(
      `UPDATE applicant_stage_records SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      vals,
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO applicant_stage_records
     (applicant_id, workflow_instance_id, workflow_stage_id, stage_name, stage_type,
      status, assigned_user_id, assigned_employee_id, scheduled_at, comments)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      applicantId, info.workflow_instance_id, workflowStageId,
      info.stage_name, info.stage_type,
      data.status || "PENDING",
      data.assigned_user_id || null, data.assigned_employee_id || null,
      data.scheduled_at || null, data.comments || null,
    ],
  );
  return result.rows[0];
};

const getCurrentStageRecord = async (applicantId) => {
  const result = await pool.query(
    `SELECT asr.*, rws.requires_score, rws.requires_assignment, rws.requires_approval,
            rws.is_terminal, rws.passing_score, rws.allow_skip, rws.workflow_id
     FROM applicant_stage_records asr
     JOIN recruitment_workflow_stages rws ON rws.id = asr.workflow_stage_id
     WHERE asr.applicant_id = $1 AND asr.is_current = TRUE
     LIMIT 1`,
    [applicantId],
  );
  return result.rows[0] || null;
};

const updateStageRecord = async (stageRecordId, data) => {
  const allowed = ["assigned_user_id", "assigned_employee_id", "score", "recommendation", "comments", "scheduled_at", "status"];
  const sets = [];
  const values = [];
  let idx = 1;
  for (const key of allowed) {
    if (data[key] !== undefined) {
      sets.push(`${key} = $${idx++}`);
      values.push(data[key] === "" || data[key] === null ? null : data[key]);
    }
  }
  if (sets.length === 0) throw new Error("No valid fields to update");
  sets.push(`updated_at = NOW()`);
  values.push(stageRecordId);

  const result = await pool.query(
    `UPDATE applicant_stage_records SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );
  if (result.rows.length === 0) throw new Error("Stage record not found");
  return result.rows[0];
};

const completeStage = async (stageRecordId, { score, recommendation, comments }, currentUser) => {
  const sr = await getStageRecordById(stageRecordId);
  if (!sr) throw new Error("Stage record not found");
  if (sr.instance_status !== "ACTIVE") throw new Error("Workflow instance is not active");

  if (sr.requires_score && (score === null || score === undefined || score === "")) {
    throw new Error("Score is required for this stage");
  }

  let finalRecommendation = recommendation || "PASSED";
  if (sr.passing_score !== null && score !== null && score !== undefined && Number(score) < Number(sr.passing_score)) {
    if (!recommendation || recommendation === "PASSED") {
      throw new Error(`Score ${score} is below passing score ${sr.passing_score}. Set recommendation to FAILED or FOR_REVIEW to confirm.`);
    }
  }

  let stageRecordRec;
  if (sr.stage_type === "APPROVAL" && sr.requires_approval) {
    if (!recommendation || !["APPROVED", "REJECTED"].includes(recommendation)) {
      throw new Error("Approval stage requires recommendation: APPROVED or REJECTED");
    }
    stageRecordRec = recommendation === "REJECTED" ? "FAILED" : null;
  } else {
    if (!["PASSED", "FAILED", "FOR_REVIEW", null].includes(finalRecommendation)) {
      throw new Error("Invalid recommendation. Allowed: PASSED, FAILED, FOR_REVIEW");
    }
    stageRecordRec = finalRecommendation;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE applicant_stage_records
       SET score = $1, recommendation = $2, comments = $3,
           status = 'COMPLETED', completed_at = NOW(), is_current = FALSE,
           updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [score || null, stageRecordRec, comments || null, stageRecordId],
    );
    const updated = result.rows[0];

    if (sr.stage_type === "APPROVAL" && sr.requires_approval && (finalRecommendation === "APPROVED" || finalRecommendation === "REJECTED")) {
      await client.query(
        `INSERT INTO applicant_stage_approvals
         (applicant_id, stage_record_id, workflow_stage_id, approver_employee_id, decision, comments)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sr.applicant_id, stageRecordId, sr.workflow_stage_id, currentUser?.employee_id || null, finalRecommendation, comments || null],
      );
    }

    await client.query("COMMIT");

    let nextAction;
    if (finalRecommendation === "FAILED") {
      nextAction = "FAIL_WORKFLOW";
    } else if (finalRecommendation === "FOR_REVIEW") {
      nextAction = "REVIEW";
    } else if (sr.stage_type === "APPROVAL" && finalRecommendation === "REJECTED") {
      nextAction = "FAIL_WORKFLOW";
    } else {
      nextAction = "MOVE_NEXT";
    }

    notifyHRUsers(
      "Stage Completed",
      `${sr.stage_name} completed for ${sr.first_name} ${sr.last_name}`,
      sr.applicant_id,
    );

    if (finalRecommendation === "FOR_REVIEW") {
      notifyHRUsers(
        "Stage Needs Review",
        `${sr.stage_name} needs review for ${sr.first_name} ${sr.last_name}`,
        sr.applicant_id,
      );
    }

    return { stageRecord: updated, nextAction };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const moveToNextStage = async (applicantId, currentStageRecordId, currentUser) => {
  const sr = await getStageRecordById(currentStageRecordId);
  if (!sr) throw new Error("Stage record not found");

  const workflowStages = await pool.query(
    `SELECT * FROM recruitment_workflow_stages WHERE workflow_id = $1 ORDER BY sequence_order ASC`,
    [sr.workflow_id],
  );
  if (workflowStages.rows.length === 0) throw new Error("Workflow has no stages");

  const currentIdx = workflowStages.rows.findIndex((s) => s.id === sr.workflow_stage_id);
  if (currentIdx === -1) throw new Error("Current stage not found in workflow definition");

  const currentStageDef = workflowStages.rows[currentIdx];

  if (currentStageDef.requires_approval && currentStageDef.stage_type === "APPROVAL") {
    const approvalResult = await pool.query(
      `SELECT decision FROM applicant_stage_approvals WHERE stage_record_id = $1 ORDER BY id DESC LIMIT 1`,
      [currentStageRecordId],
    );
    let decision = approvalResult.rows.length > 0 ? approvalResult.rows[0].decision : null;

    if (!decision) {
      await createPendingStageApprovalIfNeeded(currentStageRecordId);
      throw new Error("Approval is still pending. This applicant cannot move to the next stage yet.");
    }
    if (decision === "PENDING") {
      throw new Error("Approval is still pending. This applicant cannot move to the next stage yet.");
    }
    if (decision === "REJECTED") {
      throw new Error("Approval was rejected. Fail the workflow before moving to the next stage.");
    }
  }

  let nextStageDef;

  if (currentStageDef.next_stage_on_pass) {
    nextStageDef = workflowStages.rows.find((s) => s.id === currentStageDef.next_stage_on_pass);
  } else {
    nextStageDef = workflowStages.rows[currentIdx + 1];
  }

  if (!nextStageDef) {
    if (currentStageDef.is_terminal) {
      await pool.query(
        `UPDATE applicant_workflow_instances SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW()
         WHERE applicant_id = $1`,
        [applicantId],
      );
      return { action: "WORKFLOW_COMPLETED", message: "Workflow completed" };
    }
    throw new Error("No next stage found");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE applicant_stage_records SET is_current = FALSE, updated_at = NOW()
       WHERE applicant_id = $1 AND is_current = TRUE`,
      [applicantId],
    );

    const existingNext = await client.query(
      `SELECT id, assigned_user_id, assigned_employee_id, scheduled_at FROM applicant_stage_records
       WHERE workflow_instance_id = $1 AND workflow_stage_id = $2
       ORDER BY is_current DESC, id DESC
       LIMIT 1`,
      [sr.workflow_instance_id, nextStageDef.id],
    );

    let newRecord;
    if (existingNext.rows.length > 0) {
      await client.query(
        `UPDATE applicant_stage_records SET is_current = FALSE, updated_at = NOW()
         WHERE workflow_instance_id = $1 AND workflow_stage_id = $2`,
        [sr.workflow_instance_id, nextStageDef.id],
      );
      newRecord = await client.query(
        `UPDATE applicant_stage_records
         SET status = CASE WHEN scheduled_at IS NOT NULL THEN 'SCHEDULED' ELSE 'PENDING' END,
             is_current = TRUE,
             stage_name = $1, stage_type = $2,
             score = NULL, recommendation = NULL, comments = NULL,
             completed_at = NULL, updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [nextStageDef.stage_name, nextStageDef.stage_type, existingNext.rows[0].id],
      );
    } else {
      newRecord = await client.query(
        `INSERT INTO applicant_stage_records
         (applicant_id, workflow_instance_id, workflow_stage_id, stage_name, stage_type, status, is_current)
         VALUES ($1, $2, $3, $4, $5, 'PENDING', TRUE) RETURNING *`,
        [applicantId, sr.workflow_instance_id, nextStageDef.id, nextStageDef.stage_name, nextStageDef.stage_type],
      );
    }

    await client.query(
      `UPDATE applicant_workflow_instances SET current_stage_id = $1, updated_at = NOW()
       WHERE applicant_id = $2`,
      [nextStageDef.id, applicantId],
    );

    await client.query("COMMIT");

    return {
      action: "MOVED",
      previous_stage_id: currentStageDef.id,
      next_stage_id: nextStageDef.id,
      next_stage_name: nextStageDef.stage_name,
      new_stage_record: newRecord.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const failWorkflow = async (applicantId, currentStageRecordId, currentUser) => {
  const sr = await getStageRecordById(currentStageRecordId);
  if (!sr) throw new Error("Stage record not found");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE applicant_workflow_instances SET status = 'FAILED', completed_at = NOW(), updated_at = NOW()
       WHERE applicant_id = $1`,
      [applicantId],
    );

    await client.query(
      `UPDATE applicant_stage_records SET status = 'FAILED', is_current = FALSE, updated_at = NOW()
       WHERE id = $1`,
      [currentStageRecordId],
    );

    await client.query(
      `UPDATE applicants SET status = 'Fail', updated_at = NOW() WHERE id = $1`,
      [applicantId],
    );

    await client.query("COMMIT");

    return { action: "FAILED", message: "Workflow failed" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const skipStage = async (stageRecordId, currentUser) => {
  const sr = await getStageRecordById(stageRecordId);
  if (!sr) throw new Error("Stage record not found");
  if (!sr.allow_skip) throw new Error("This stage does not allow skipping");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE applicant_stage_records SET status = 'SKIPPED', is_current = FALSE, updated_at = NOW()
       WHERE id = $1`,
      [stageRecordId],
    );

    const workflowStages = await client.query(
      `SELECT * FROM recruitment_workflow_stages WHERE workflow_id = $1 ORDER BY sequence_order ASC`,
      [sr.workflow_id],
    );

    const currentIdx = workflowStages.rows.findIndex((s) => s.id === sr.workflow_stage_id);
    const nextStageDef = workflowStages.rows[currentIdx + 1];

    if (nextStageDef) {
      const newRecord = await client.query(
        `INSERT INTO applicant_stage_records
         (applicant_id, workflow_instance_id, workflow_stage_id, stage_name, stage_type, status, is_current)
         VALUES ($1, $2, $3, $4, $5, 'PENDING', TRUE) RETURNING *`,
        [sr.applicant_id, sr.workflow_instance_id, nextStageDef.id, nextStageDef.stage_name, nextStageDef.stage_type],
      );

      await client.query(
        `UPDATE applicant_workflow_instances SET current_stage_id = $1, updated_at = NOW()
         WHERE applicant_id = $2`,
        [nextStageDef.id, sr.applicant_id],
      );

      await client.query("COMMIT");
      return { action: "SKIPPED_MOVED", next_stage_name: nextStageDef.stage_name, new_stage_record: newRecord.rows[0] };
    }

    await client.query("COMMIT");
    return { action: "SKIPPED", message: "Stage skipped" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getStageApproval = async (stageRecordId) => {
  const result = await pool.query(
    `SELECT asa.*,
            e1.first_name AS approver_first_name, e1.last_name AS approver_last_name,
            u2.id AS assignee_user_id, u2.username AS assignee_username,
            e2.first_name AS assignee_first_name, e2.last_name AS assignee_last_name,
            u3.id AS assigned_by_user_id,
            e3.first_name AS assigned_by_first_name, e3.last_name AS assigned_by_last_name
     FROM applicant_stage_approvals asa
     LEFT JOIN employees e1 ON e1.id = asa.approver_employee_id
     LEFT JOIN users u2 ON u2.id = asa.assigned_user_id
     LEFT JOIN employees e2 ON e2.id = COALESCE(u2.employee_id, asa.assigned_employee_id)
     LEFT JOIN users u3 ON u3.id = asa.assigned_by
     LEFT JOIN employees e3 ON e3.id = u3.employee_id
     WHERE asa.stage_record_id = $1
     ORDER BY asa.id DESC LIMIT 1`,
    [stageRecordId],
  );
  return result.rows[0] || null;
};

const createPendingStageApprovalIfNeeded = async (stageRecordId) => {
  const existing = await getStageApproval(stageRecordId);
  if (existing) return existing;

  const sr = await getStageRecordById(stageRecordId);
  if (!sr) throw new Error("Stage record not found");

  const result = await pool.query(
    `INSERT INTO applicant_stage_approvals
     (applicant_id, stage_record_id, workflow_stage_id, decision, approval_level)
     VALUES ($1, $2, $3, 'PENDING', 1) RETURNING *`,
    [sr.applicant_id, stageRecordId, sr.workflow_stage_id],
  );
  const approval = result.rows[0];

  notifyHRUsers(
    "Approval Required",
    `Approval required for ${sr.first_name} ${sr.last_name} - ${sr.stage_name}.`,
    sr.applicant_id,
  );

  return approval;
};

const checkApprovalPermission = async (stageRecordId, currentUser) => {
  const result = await pool.query(
    `SELECT assigned_user_id, assigned_employee_id FROM applicant_stage_approvals WHERE stage_record_id = $1 LIMIT 1`,
    [stageRecordId],
  );

  if (result.rows.length > 0) {
    const a = result.rows[0];
    if (a.assigned_user_id || a.assigned_employee_id) {
      const isAssigned =
        (a.assigned_user_id && Number(a.assigned_user_id) === Number(currentUser?.id)) ||
        (a.assigned_employee_id && Number(a.assigned_employee_id) === Number(currentUser?.employee_id));

      if (!isAssigned) {
        if (currentUser?.role === "ADMIN") return;
        const perm = await pool.query(
          `SELECT 1 FROM user_permissions WHERE user_id = $1 AND permission_key = 'recruitment.approvals.manage' AND is_allowed = TRUE`,
          [currentUser?.id],
        );
        if (perm.rows.length === 0) {
          throw new Error("Only the assigned approver or authorized approval manager can approve this stage.");
        }
      }
    }
  }
};

const assignApprovalStage = async (stageRecordId, data, currentUser) => {
  const sr = await getStageRecordById(stageRecordId);
  if (!sr) throw new Error("Stage record not found");

  const wfStage = await pool.query(
    `SELECT stage_type, requires_approval FROM recruitment_workflow_stages WHERE id = $1`,
    [sr.workflow_stage_id],
  );
  if (wfStage.rows.length === 0) throw new Error("Workflow stage not found");
  if (wfStage.rows[0].stage_type !== "APPROVAL" || !wfStage.rows[0].requires_approval) {
    throw new Error("Stage is not an approval stage");
  }

  let approval = await getStageApproval(stageRecordId);
  if (!approval) {
    approval = await createPendingStageApprovalIfNeeded(stageRecordId);
  }

  const { assigned_user_id, assigned_employee_id, scheduled_at, comments } = data;

  const result = await pool.query(
    `UPDATE applicant_stage_approvals
     SET assigned_user_id = $1, assigned_employee_id = $2, scheduled_at = $3,
         assigned_at = NOW(), assigned_by = $4,
         comments = CASE WHEN $5::text IS NOT NULL THEN $5::text ELSE comments END,
         updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [assigned_user_id || null, assigned_employee_id || null, scheduled_at || null, currentUser?.id || null, comments || null, approval.id],
  );

  const updated = result.rows[0];

  if (assigned_user_id) {
    let msg = `You have been assigned to approve ${sr.first_name} ${sr.last_name} - ${sr.stage_name}.`;
    if (scheduled_at) {
      msg += ` Scheduled: ${new Date(scheduled_at).toLocaleString()}.`;
    }
    notificationService.notify({
      user_id: assigned_user_id,
      type: "RECRUITMENT",
      title: "Approval Assignment",
      message: msg,
      reference_id: sr.applicant_id,
    }).catch(() => {});
  }

  notifyHRUsers(
    "Approval Assigned",
    `Approval assigned for ${sr.first_name} ${sr.last_name} - ${sr.stage_name}.`,
    sr.applicant_id,
  );

  return updated;
};

const getMyApprovalAssignments = async (userId, employeeId) => {
  const result = await pool.query(
    `SELECT asa.*, asr.stage_name, asr.status AS stage_status,
            a.id AS applicant_id, a.first_name AS applicant_first_name, a.last_name AS applicant_last_name,
            a.status AS applicant_status,
            jp.title AS job_title,
            rws.stage_type,
            e.first_name || ' ' || e.last_name AS assigned_by_name
     FROM applicant_stage_approvals asa
     JOIN applicant_stage_records asr ON asr.id = asa.stage_record_id
     JOIN applicants a ON a.id = asa.applicant_id
     LEFT JOIN job_positions jp ON jp.id = a.job_position_id
     JOIN recruitment_workflow_stages rws ON rws.id = asa.workflow_stage_id
     LEFT JOIN users u ON u.id = asa.assigned_by
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE (asa.assigned_user_id = $1 OR asa.assigned_employee_id = $2)
       AND asa.decision = 'PENDING'
      ORDER BY asa.scheduled_at ASC NULLS LAST, asa.created_at DESC`,
    [userId, employeeId],
  );
  return result.rows;
};

const getMyWorkflowStageAssignments = async (userId, employeeId) => {
  const result = await pool.query(
    `SELECT asr.id AS stage_record_id,
            asr.applicant_id,
            a.first_name || ' ' || a.last_name AS applicant_name,
            a.status AS applicant_status,
            jp.title AS job_title,
            rw.name AS workflow_name,
            asr.stage_name,
            rws.stage_type,
            asr.status,
            asr.scheduled_at,
            asr.score,
            asr.recommendation,
            asr.comments,
            asr.assigned_user_id,
            asr.assigned_employee_id,
            asr.is_current,
             COALESCE(e1.first_name, e2.first_name) AS assigned_first_name,
             COALESCE(e1.last_name, e2.last_name) AS assigned_last_name,
             u.username AS assigned_username,
             COALESCE(e1.employee_code, e2.employee_code) AS assigned_employee_code
     FROM applicant_stage_records asr
     JOIN recruitment_workflow_stages rws ON rws.id = asr.workflow_stage_id
     JOIN applicants a ON a.id = asr.applicant_id
     LEFT JOIN job_positions jp ON jp.id = a.job_position_id
     JOIN applicant_workflow_instances awi ON awi.id = asr.workflow_instance_id
     JOIN recruitment_workflows rw ON rw.id = awi.workflow_id
     LEFT JOIN users u ON u.id = asr.assigned_user_id
     LEFT JOIN employees e1 ON e1.id = u.employee_id
     LEFT JOIN employees e2 ON e2.id = asr.assigned_employee_id
     WHERE (asr.assigned_user_id = $1 OR asr.assigned_employee_id = $2)
       AND asr.status IN ('PENDING', 'SCHEDULED', 'IN_PROGRESS')
     ORDER BY asr.scheduled_at ASC NULLS LAST, asr.created_at DESC`,
    [userId, employeeId],
  );
  return result.rows.map((row) => ({
    ...row,
    assigned_name:
      row.assigned_first_name
        ? `${row.assigned_first_name} ${row.assigned_last_name || ""}`.trim()
        : row.assigned_username
          ? row.assigned_username
          : row.assigned_employee_code
            ? row.assigned_employee_code
            : row.assigned_user_id
              ? `User #${row.assigned_user_id}`
              : null,
  }));
};

const getPossibleApprovers = async () => {
  const result = await pool.query(
    `SELECT u.id AS user_id, u.username, e.id AS employee_id,
            e.first_name || ' ' || e.last_name AS employee_name, e.employee_code
     FROM users u
     INNER JOIN employees e ON e.id = u.employee_id
     WHERE e.status = 'ACTIVE'
     ORDER BY e.first_name ASC`,
  );
  return result.rows;
};

const getAssignableUsers = async (page = 1, limit = 20, search = "") => {
  const offset = (page - 1) * limit;
  const searchVal = search ? `%${search}%` : "";

  const data = await pool.query(
    `SELECT u.id AS user_id, u.username, e.id AS employee_id,
            e.first_name || ' ' || e.last_name AS name, e.employee_code,
            e.department, e.position, e.status AS employee_status,
            b.name AS branch_name
     FROM users u
     INNER JOIN employees e ON e.id = u.employee_id
     LEFT JOIN branches b ON b.id = e.branch_id
     WHERE e.status = 'ACTIVE'
       AND ($1 = '' OR e.first_name ILIKE $1 OR e.last_name ILIKE $1 OR (e.first_name || ' ' || e.last_name) ILIKE $1 OR e.employee_code ILIKE $1 OR u.username ILIKE $1)
     ORDER BY e.first_name ASC
     LIMIT $2 OFFSET $3`,
    [searchVal, limit, offset],
  );

  const count = await pool.query(
    `SELECT COUNT(*) FROM users u
     INNER JOIN employees e ON e.id = u.employee_id
     WHERE e.status = 'ACTIVE'
       AND ($1 = '' OR e.first_name ILIKE $1 OR e.last_name ILIKE $1 OR (e.first_name || ' ' || e.last_name) ILIKE $1 OR e.employee_code ILIKE $1 OR u.username ILIKE $1)`,
    [searchVal],
  );

  return {
    data: data.rows,
    pagination: {
      total: parseInt(count.rows[0].count),
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    },
  };
};

const approveStage = async (stageRecordId, comments, currentUser) => {
  const sr = await getStageRecordById(stageRecordId);
  if (!sr) throw new Error("Stage record not found");
  if (sr.instance_status !== "ACTIVE") throw new Error("Workflow instance is not active");
  if (sr.stage_type !== "APPROVAL" || !sr.requires_approval) throw new Error("Stage is not an approval stage");

  await checkApprovalPermission(stageRecordId, currentUser);

  let employeeId = currentUser?.employee_id || null;
  if (currentUser && !currentUser.employee_id) {
    console.warn(`[approveStage] Warning: currentUser has no employee_id. user: ${JSON.stringify(currentUser)}`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT id FROM applicant_stage_approvals WHERE stage_record_id = $1 LIMIT 1`,
      [stageRecordId],
    );

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE applicant_stage_approvals
         SET decision = 'APPROVED', approver_employee_id = $1, comments = $2, decided_at = NOW(), updated_at = NOW()
         WHERE id = $3`,
        [employeeId, comments || null, existing.rows[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO applicant_stage_approvals
         (applicant_id, stage_record_id, workflow_stage_id, approver_employee_id, decision, comments, decided_at, approval_level)
         VALUES ($1, $2, $3, $4, 'APPROVED', $5, NOW(), 1)`,
        [sr.applicant_id, stageRecordId, sr.workflow_stage_id, employeeId, comments || null],
      );
    }

    const updated = await client.query(
      `UPDATE applicant_stage_records
       SET status = 'COMPLETED', completed_at = NOW(),
           recommendation = NULL, comments = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [comments || null, stageRecordId],
    );

    await client.query("COMMIT");

    notifyHRUsers(
      "Approval Completed",
      `${sr.stage_name} approved for ${sr.first_name} ${sr.last_name}.`,
      sr.applicant_id,
    );

    return { stageRecord: updated.rows[0], nextAction: "MOVE_NEXT" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const rejectStage = async (stageRecordId, comments, currentUser) => {
  const sr = await getStageRecordById(stageRecordId);
  if (!sr) throw new Error("Stage record not found");
  if (sr.instance_status !== "ACTIVE") throw new Error("Workflow instance is not active");
  if (sr.stage_type !== "APPROVAL" || !sr.requires_approval) throw new Error("Stage is not an approval stage");

  await checkApprovalPermission(stageRecordId, currentUser);

  let employeeId = currentUser?.employee_id || null;
  if (currentUser && !currentUser.employee_id) {
    console.warn(`[rejectStage] Warning: currentUser has no employee_id. user: ${JSON.stringify(currentUser)}`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT id FROM applicant_stage_approvals WHERE stage_record_id = $1 LIMIT 1`,
      [stageRecordId],
    );

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE applicant_stage_approvals
         SET decision = 'REJECTED', approver_employee_id = $1, comments = $2, decided_at = NOW(), updated_at = NOW()
         WHERE id = $3`,
        [employeeId, comments || null, existing.rows[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO applicant_stage_approvals
         (applicant_id, stage_record_id, workflow_stage_id, approver_employee_id, decision, comments, decided_at, approval_level)
         VALUES ($1, $2, $3, $4, 'REJECTED', $5, NOW(), 1)`,
        [sr.applicant_id, stageRecordId, sr.workflow_stage_id, employeeId, comments || null],
      );
    }

    const updated = await client.query(
      `UPDATE applicant_stage_records
       SET status = 'FAILED', completed_at = NOW(),
           recommendation = 'FAILED', comments = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [comments || null, stageRecordId],
    );

    await client.query("COMMIT");

    notifyHRUsers(
      "Approval Rejected",
      `${sr.stage_name} rejected for ${sr.first_name} ${sr.last_name}.`,
      sr.applicant_id,
    );

    return { stageRecord: updated.rows[0], nextAction: "FAIL_WORKFLOW" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const rollbackToStage = async (applicantId, targetStageId, reason, currentUser) => {
  if (!reason || !reason.trim()) throw new Error("Correction reason is required.");

  const applicant = await pool.query(`SELECT * FROM applicants WHERE id = $1`, [applicantId]);
  if (applicant.rows.length === 0) throw new Error("Applicant not found");
  if (!applicant.rows[0].workflow_instance_id) throw new Error("Applicant does not have a dynamic workflow instance.");

  const instanceResult = await pool.query(
    `SELECT * FROM applicant_workflow_instances WHERE applicant_id = $1`,
    [applicantId],
  );
  if (instanceResult.rows.length === 0) throw new Error("Workflow instance not found.");
  const instance = instanceResult.rows[0];

  const targetStage = await pool.query(
    `SELECT * FROM recruitment_workflow_stages WHERE id = $1 AND workflow_id = $2`,
    [targetStageId, instance.workflow_id],
  );
  if (targetStage.rows.length === 0) throw new Error("Target stage not found in this workflow.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const oldCurrent = await client.query(
      `SELECT id, stage_name, status FROM applicant_stage_records
       WHERE applicant_id = $1 AND is_current = TRUE LIMIT 1`,
      [applicantId],
    );

    await client.query(
      `UPDATE applicant_stage_records SET is_current = FALSE, updated_at = NOW()
       WHERE applicant_id = $1`,
      [applicantId],
    );

    const existingRecord = await client.query(
      `SELECT id FROM applicant_stage_records
       WHERE applicant_id = $1 AND workflow_stage_id = $2
       ORDER BY id DESC LIMIT 1`,
      [applicantId, targetStageId],
    );

    let targetRecord;
    if (existingRecord.rows.length > 0) {
      targetRecord = await client.query(
        `UPDATE applicant_stage_records
         SET is_current = TRUE, status = 'PENDING', score = NULL, recommendation = NULL,
             completed_at = NULL, updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [existingRecord.rows[0].id],
      );
    } else {
      targetRecord = await client.query(
        `INSERT INTO applicant_stage_records
         (applicant_id, workflow_instance_id, workflow_stage_id,
          stage_name, stage_type, status, is_current)
         VALUES ($1, $2, $3, $4, $5, 'PENDING', TRUE) RETURNING *`,
        [applicantId, instance.id, targetStageId,
         targetStage.rows[0].stage_name, targetStage.rows[0].stage_type],
      );
    }

    await client.query(
      `UPDATE applicant_workflow_instances
       SET current_stage_id = $1, status = 'ACTIVE', completed_at = NULL, updated_at = NOW()
       WHERE applicant_id = $2`,
      [targetStageId, applicantId],
    );

    await client.query(
      `UPDATE applicants SET status = 'Initial', updated_at = NOW() WHERE id = $1`,
      [applicantId],
    );

    await client.query("COMMIT");

    const oldStageName = oldCurrent.rows.length > 0 ? oldCurrent.rows[0].stage_name : "none";
    console.log(
      `[applicantWorkflow] rollback: applicant #${applicantId} rolled back to "${targetStage.rows[0].stage_name}". Reason: ${reason}`,
    );

    return {
      action: "ROLLBACK",
      previous_stage_id: oldCurrent.rows.length > 0 ? oldCurrent.rows[0].id : null,
      previous_stage_name: oldCurrent.rows.length > 0 ? oldCurrent.rows[0].stage_name : null,
      target_stage_id: targetStageId,
      target_stage_name: targetStage.rows[0].stage_name,
      reason,
      new_stage_record: targetRecord.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const correctStageResult = async (stageRecordId, data, currentUser) => {
  if (!data.correction_reason || !data.correction_reason.trim()) {
    throw new Error("Correction reason is required.");
  }

  const sr = await getStageRecordById(stageRecordId);
  if (!sr) throw new Error("Stage record not found");

  const allowedFields = ["status", "score", "recommendation", "comments"];
  const oldValues = {};
  const newValues = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined && data[field] !== null) {
      oldValues[field] = sr[field];
      newValues[field] = data[field];
    }
  }

  if (Object.keys(newValues).length === 0) {
    throw new Error("No valid fields to correct. Provide at least one of: status, score, recommendation, comments.");
  }

  const sets = [];
  const params = [];
  let idx = 1;
  for (const field of allowedFields) {
    if (data[field] !== undefined && data[field] !== null) {
      sets.push(`${field} = $${idx++}`);
      params.push(data[field]);
    }
  }
  sets.push(`updated_at = NOW()`);
  params.push(stageRecordId);

  const result = await pool.query(
    `UPDATE applicant_stage_records SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    params,
  );
  if (result.rows.length === 0) throw new Error("Stage record not found");

  console.log(
    `[applicantWorkflow] Stage #${stageRecordId} corrected. Reason: ${data.correction_reason}`,
  );

  return {
    action: "CORRECTED",
    stageRecord: result.rows[0],
    old_values: oldValues,
    new_values: newValues,
    correction_reason: data.correction_reason,
  };
};

const failDynamicApplicant = async (applicantId, reason, currentUser) => {
  if (!reason || !reason.trim()) throw new Error("Failure reason is required.");

  const applicant = await pool.query(`SELECT * FROM applicants WHERE id = $1`, [applicantId]);
  if (applicant.rows.length === 0) throw new Error("Applicant not found");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE applicant_workflow_instances
       SET status = 'FAILED', completed_at = NOW(), updated_at = NOW()
       WHERE applicant_id = $1`,
      [applicantId],
    );

    await client.query(
      `UPDATE applicant_stage_records
       SET status = 'FAILED', is_current = FALSE, updated_at = NOW()
       WHERE applicant_id = $1 AND is_current = TRUE`,
      [applicantId],
    );

    await client.query(
      `UPDATE applicants SET status = 'Fail', updated_at = NOW() WHERE id = $1`,
      [applicantId],
    );

    await client.query("COMMIT");

    console.log(
      `[applicantWorkflow] Applicant #${applicantId} failed by admin. Reason: ${reason}`,
    );

    return {
      action: "ADMIN_FAILED",
      applicant_id: applicantId,
      reason,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  resolveWorkflowForApplicant,
  resolveDefaultWorkflow,
  resolveWorkflowForCreation,
  getStagesForWorkflow,
  createWorkflowInstanceForApplicant,
  autoInitializeWorkflow,
  getApplicantWorkflowTimeline,
  getStageRecordById,
  createStageRecord,
  getCurrentStageRecord,
  updateStageRecord,
  completeStage,
  moveToNextStage,
  failWorkflow,
  skipStage,
  getStageApproval,
  createPendingStageApprovalIfNeeded,
  checkApprovalPermission,
  assignApprovalStage,
  getMyApprovalAssignments,
  getMyWorkflowStageAssignments,
  getPossibleApprovers,
  getAssignableUsers,
  approveStage,
  rejectStage,
  rollbackToStage,
  correctStageResult,
  failDynamicApplicant,
};
