const pool = require("../config/db");
const notificationService = require("../services/notification.service");
const logger = require("../utils/logger");

jest.mock("../config/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));
jest.mock("../services/notification.service", () => ({
  notify: jest.fn(),
}));
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const {
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
} = require("../services/applicantWorkflow.service");

const mClient = { query: jest.fn(), release: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  pool.query.mockResolvedValue({ rows: [] });
  pool.connect.mockResolvedValue(mClient);
  notificationService.notify.mockResolvedValue();
  mClient.query.mockResolvedValue({ rows: [] });
  mClient.release.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------- resolveWorkflowForApplicant ----------
describe("resolveWorkflowForApplicant", () => {
  it("returns null when no jobPositionId is provided", async () => {
    const result = await resolveWorkflowForApplicant(null);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("returns null when no active workflow is found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const result = await resolveWorkflowForApplicant(99);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("returns the workflow row when found", async () => {
    const fakeWorkflow = { id: 1, name: "Default", is_active: true };
    pool.query.mockResolvedValueOnce({ rows: [fakeWorkflow] });
    const result = await resolveWorkflowForApplicant(5);
    expect(result).toEqual(fakeWorkflow);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("job_positions jp"),
      [5],
    );
  });
});

// ---------- resolveDefaultWorkflow ----------
describe("resolveDefaultWorkflow", () => {
  it("returns null when no default active workflow exists", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const result = await resolveDefaultWorkflow();
    expect(result).toBeNull();
  });

  it("returns the default workflow row", async () => {
    const fake = { id: 10, name: "Default WF", is_default: true, is_active: true };
    pool.query.mockResolvedValueOnce({ rows: [fake] });
    const result = await resolveDefaultWorkflow();
    expect(result).toEqual(fake);
  });
});

// ---------- resolveWorkflowForCreation ----------
describe("resolveWorkflowForCreation", () => {
  it("throws if no jobPositionId", async () => {
    await expect(resolveWorkflowForCreation(null)).rejects.toThrow(
      "No job position selected",
    );
  });

  it("throws if job position not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(resolveWorkflowForCreation(1)).rejects.toThrow(
      "Selected job position not found",
    );
  });

  it("throws if assigned workflow is inactive", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ workflow_id: 5, title: "Engineer" }] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(resolveWorkflowForCreation(1)).rejects.toThrow(/inactive/);
  });

  it("falls back to default when no workflow assigned", async () => {
    const defaultWf = { id: 2, name: "Default", is_active: true };
    pool.query
      .mockResolvedValueOnce({ rows: [{ workflow_id: null, title: "Eng" }] })
      .mockResolvedValueOnce({ rows: [defaultWf] })
      .mockResolvedValueOnce({ rows: [{ id: 10, stage_name: "S1", sequence_order: 1 }] });
    const result = await resolveWorkflowForCreation(1);
    expect(result).toEqual({ workflow: defaultWf, stages: [{ id: 10, stage_name: "S1", sequence_order: 1 }] });
  });

  it("throws if no default workflow found", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ workflow_id: null, title: "Eng" }] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(resolveWorkflowForCreation(1)).rejects.toThrow(
      /No recruitment workflow assigned/,
    );
  });

  it("throws if workflow has no stages", async () => {
    const wf = { id: 1, name: "WF", is_active: true };
    pool.query
      .mockResolvedValueOnce({ rows: [{ workflow_id: 1, title: "Eng" }] })
      .mockResolvedValueOnce({ rows: [wf] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(resolveWorkflowForCreation(1)).rejects.toThrow(/has no stages/);
  });

  it("returns workflow and stages on success", async () => {
    const wf = { id: 1, name: "WF", is_active: true };
    const stages = [{ id: 10, stage_name: "S1", sequence_order: 1 }];
    pool.query
      .mockResolvedValueOnce({ rows: [{ workflow_id: 1, title: "Eng" }] })
      .mockResolvedValueOnce({ rows: [wf] })
      .mockResolvedValueOnce({ rows: stages });
    const result = await resolveWorkflowForCreation(1);
    expect(result).toEqual({ workflow: wf, stages });
  });
});

// ---------- getStagesForWorkflow ----------
describe("getStagesForWorkflow", () => {
  it("returns rows from pool", async () => {
    const rows = [{ id: 1, stage_name: "Interview", sequence_order: 1 }];
    pool.query.mockResolvedValueOnce({ rows });
    const result = await getStagesForWorkflow(42);
    expect(result).toEqual(rows);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("recruitment_workflow_stages"),
      [42],
    );
  });
});

// ---------- createWorkflowInstanceForApplicant ----------
describe("createWorkflowInstanceForApplicant", () => {
  it("returns null if no stages provided", async () => {
    const result = await createWorkflowInstanceForApplicant(1, { id: 1 }, []);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("creates instance, stage record, and updates applicant via transaction", async () => {
    const workflow = { id: 1, name: "WF", description: "d", is_default: true, is_active: true, version: 1 };
    const stages = [{ id: 10, stage_name: "S1", stage_type: "REVIEW", sequence_order: 1, is_required: true, requires_assignment: false, requires_score: false, requires_approval: false, passing_score: null, allow_skip: false, auto_proceed_on_pass: false, days_to_complete: null, is_terminal: false }];
    const fakeInstance = { id: 100, applicant_id: 1, workflow_id: 1, current_stage_id: 10, status: "ACTIVE" };

    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [fakeInstance] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await createWorkflowInstanceForApplicant(1, workflow, stages);
    expect(result).toEqual(fakeInstance);
    expect(mClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mClient.release).toHaveBeenCalled();
  });

  it("rolls back on error and returns null", async () => {
    const workflow = { id: 1, name: "WF" };
    const stages = [{ id: 10, stage_name: "S1", stage_type: "REVIEW", sequence_order: 1 }];

    mClient.query.mockRejectedValueOnce(new Error("DB down"));
    const result = await createWorkflowInstanceForApplicant(1, workflow, stages);
    expect(result).toBeNull();
    expect(mClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(logger.error).toHaveBeenCalled();
    expect(mClient.release).toHaveBeenCalled();
  });
});

// ---------- autoInitializeWorkflow ----------
describe("autoInitializeWorkflow", () => {
  it("returns applicant if no applicant or no id", async () => {
    const result = await autoInitializeWorkflow(null);
    expect(result).toBeNull();
  });

  it("uses preResolved if provided", async () => {
    const preResolved = { workflow: { id: 1 }, stages: [{ id: 10 }] };
    const fakeInstance = { id: 200 };
    pool.connect.mockResolvedValue(mClient);
    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [fakeInstance] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const applicant = { id: 5, job_position_id: 3 };
    const result = await autoInitializeWorkflow(applicant, preResolved);
    expect(result.workflow_instance_id).toBe(200);
  });

  it("returns applicant if no job_position_id and no preResolved", async () => {
    const applicant = { id: 5, job_position_id: null };
    const result = await autoInitializeWorkflow(applicant);
    expect(result).toBe(applicant);
  });

  it("resolves workflow and creates instance", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, stage_name: "S1" }] });

    const fakeInstance = { id: 300 };
    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [fakeInstance] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const applicant = { id: 5, job_position_id: 3 };
    const result = await autoInitializeWorkflow(applicant);
    expect(result.workflow_instance_id).toBe(300);
  });
});

// ---------- getApplicantWorkflowTimeline ----------
describe("getApplicantWorkflowTimeline", () => {
  it("returns LEGACY if applicant not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const result = await getApplicantWorkflowTimeline(1);
    expect(result).toEqual({ mode: "LEGACY" });
  });

  it("returns LEGACY if no workflow_instance_id", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, workflow_instance_id: null }] });
    const result = await getApplicantWorkflowTimeline(1);
    expect(result).toEqual({ mode: "LEGACY" });
  });

  it("returns LEGACY if instance not found", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, workflow_instance_id: 99 }] })
      .mockResolvedValueOnce({ rows: [] });
    const result = await getApplicantWorkflowTimeline(1);
    expect(result).toEqual({ mode: "LEGACY" });
  });

  it("returns DYNAMIC with stages", async () => {
    const applicant = { id: 1, workflow_instance_id: 99, workflow_name: "WF" };
    const instance = { id: 99, workflow_id: 5, current_stage_id: 10, status: "ACTIVE", started_at: "2025-01-01", completed_at: null };
    const stageRow = {
      workflow_stage_id: 10, sequence_order: 1, stage_name: "S1", stage_type: "REVIEW",
      stage_category: null, is_required: true, requires_assignment: false, requires_score: false,
      requires_approval: false, is_terminal: false, passing_score: null, allow_skip: false,
      stage_record_id: 100, stage_record_status: "PENDING", is_current: true,
      score: null, recommendation: null, comments: null, scheduled_at: null, completed_at: null,
      assigned_user_id: null, assigned_employee_id: null,
      assigned_first_name: null, assigned_last_name: null, assigned_username: null, assigned_employee_code: null,
      approval_id: null, approval_decision: null, approval_comments: null,
      approval_decided_at: null, approver_employee_id: null,
      approval_assigned_user_id: null, approval_assigned_employee_id: null,
      approval_scheduled_at: null, approval_assigned_at: null, approval_assigned_by: null,
      approval_approver_first_name: null, approval_approver_last_name: null,
      approval_assignee_first_name: null, approval_assignee_last_name: null,
      approval_assigned_by_first_name: null, approval_assigned_by_last_name: null,
    };

    pool.query
      .mockResolvedValueOnce({ rows: [applicant] })
      .mockResolvedValueOnce({ rows: [instance] })
      .mockResolvedValueOnce({ rows: [stageRow] });
    const result = await getApplicantWorkflowTimeline(1);
    expect(result.mode).toBe("DYNAMIC");
    expect(result.stages).toHaveLength(1);
    expect(result.stages[0].stage_name).toBe("S1");
  });
});

// ---------- getStageRecordById ----------
describe("getStageRecordById", () => {
  it("returns null when not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const result = await getStageRecordById(999);
    expect(result).toBeNull();
  });

  it("returns the stage record with joined data", async () => {
    const row = { id: 1, stage_name: "Interview", requires_score: true };
    pool.query.mockResolvedValueOnce({ rows: [row] });
    const result = await getStageRecordById(1);
    expect(result).toEqual(row);
  });
});

// ---------- createStageRecord ----------
describe("createStageRecord", () => {
  it("throws if applicant or stage not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(createStageRecord(1, 1)).rejects.toThrow("Applicant or workflow stage not found");
  });

  it("throws if no workflow instance", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, workflow_instance_id: null }] });
    await expect(createStageRecord(1, 1)).rejects.toThrow("does not have a workflow instance");
  });

  it("updates existing record if found", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, workflow_instance_id: 10, stage_name: "S1", stage_type: "REVIEW" }] })
      .mockResolvedValueOnce({ rows: [{ id: 99 }] })
      .mockResolvedValueOnce({ rows: [{ id: 99, stage_name: "S1" }] });
    const result = await createStageRecord(1, 1, { comments: "hello" });
    expect(result.id).toBe(99);
  });

  it("inserts new record if no existing", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, workflow_instance_id: 10, stage_name: "S1", stage_type: "REVIEW" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 200 }] });
    const result = await createStageRecord(1, 1);
    expect(result.id).toBe(200);
  });
});

// ---------- getCurrentStageRecord ----------
describe("getCurrentStageRecord", () => {
  it("returns null when not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const result = await getCurrentStageRecord(1);
    expect(result).toBeNull();
  });

  it("returns current stage record", async () => {
    const row = { id: 10, is_current: true };
    pool.query.mockResolvedValueOnce({ rows: [row] });
    const result = await getCurrentStageRecord(1);
    expect(result).toEqual(row);
  });
});

// ---------- updateStageRecord ----------
describe("updateStageRecord", () => {
  it("throws if no valid fields", async () => {
    await expect(updateStageRecord(1, {})).rejects.toThrow("No valid fields to update");
  });

  it("throws if record not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(updateStageRecord(1, { score: 80 })).rejects.toThrow("Stage record not found");
  });

  it("updates allowed fields", async () => {
    const fakeUpdated = { id: 1, score: 80, recommendation: "PASSED" };
    pool.query.mockResolvedValueOnce({ rows: [fakeUpdated] });
    const result = await updateStageRecord(1, { score: 80, recommendation: "PASSED" });
    expect(result).toEqual(fakeUpdated);
  });
});

// ---------- completeStage ----------
describe("completeStage", () => {
  const baseSR = {
    id: 1, workflow_stage_id: 10, workflow_id: 5, applicant_id: 1,
    stage_name: "Interview", stage_type: "REVIEW",
    requires_score: true, requires_approval: false,
    passing_score: 70, allow_skip: false, is_terminal: false,
    instance_status: "ACTIVE",
    first_name: "John", last_name: "Doe",
  };

  it("throws if stage record not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(completeStage(1, {}, {})).rejects.toThrow("Stage record not found");
  });

  it("throws if instance not active", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...baseSR, instance_status: "COMPLETED" }] });
    await expect(completeStage(1, {}, {})).rejects.toThrow("Workflow instance is not active");
  });

  it("throws if score required but missing", async () => {
    pool.query.mockResolvedValueOnce({ rows: [baseSR] });
    await expect(completeStage(1, { score: null }, {})).rejects.toThrow("Score is required");
  });

  it("throws if score below passing without fail recommendation", async () => {
    pool.query.mockResolvedValueOnce({ rows: [baseSR] });
    await expect(completeStage(1, { score: 50 }, {})).rejects.toThrow(/below passing score/);
  });

  it("completes with MOVE_NEXT action on pass", async () => {
    pool.query.mockResolvedValueOnce({ rows: [baseSR] });
    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, score: 80, recommendation: "PASSED" }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await completeStage(1, { score: 80 }, { id: 1, employee_id: 5 });
    expect(result.nextAction).toBe("MOVE_NEXT");
    expect(mClient.query).toHaveBeenCalledWith("COMMIT");
  });

  it("returns FAIL_WORKFLOW when recommendation is FAILED", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...baseSR, requires_score: false }] });
    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, recommendation: "FAILED" }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await completeStage(1, { recommendation: "FAILED" }, {});
    expect(result.nextAction).toBe("FAIL_WORKFLOW");
  });

  it("returns REVIEW when recommendation is FOR_REVIEW", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...baseSR, requires_score: false }] });
    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, recommendation: "FOR_REVIEW" }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await completeStage(1, { recommendation: "FOR_REVIEW" }, {});
    expect(result.nextAction).toBe("REVIEW");
  });

  it("rolls back on error", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...baseSR, requires_score: false }] });
    mClient.query.mockRejectedValueOnce(new Error("fail"));
    await expect(completeStage(1, {}, {})).rejects.toThrow("fail");
    expect(mClient.query).toHaveBeenCalledWith("ROLLBACK");
  });
});

// ---------- moveToNextStage ----------
describe("moveToNextStage", () => {
  const baseSR = {
    id: 1, workflow_stage_id: 10, workflow_id: 5, applicant_id: 1,
    workflow_instance_id: 100, stage_name: "S1", stage_type: "REVIEW",
    requires_score: false, requires_approval: false, is_terminal: false,
    passing_score: null, allow_skip: false, instance_status: "ACTIVE",
    first_name: "John", last_name: "Doe",
  };

  it("throws if stage record not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(moveToNextStage(1, 1, {})).rejects.toThrow("Stage record not found");
  });

  it("throws if workflow has no stages", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [baseSR] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(moveToNextStage(1, 1, {})).rejects.toThrow("Workflow has no stages");
  });

  it("returns WORKFLOW_COMPLETED when terminal stage with no next", async () => {
    const terminalStage = { id: 10, is_terminal: true, requires_approval: false, stage_type: "REVIEW" };
    pool.query
      .mockResolvedValueOnce({ rows: [{ ...baseSR, is_terminal: true }] })
      .mockResolvedValueOnce({ rows: [terminalStage] });
    const result = await moveToNextStage(1, 1, {});
    expect(result.action).toBe("WORKFLOW_COMPLETED");
  });

  it("creates next stage and moves via transaction", async () => {
    const stageDefs = [
      { id: 10, sequence_order: 1, requires_approval: false, stage_type: "REVIEW", next_stage_on_pass: null, is_terminal: false, stage_name: "S1", stage_type: "REVIEW" },
      { id: 20, sequence_order: 2, requires_approval: false, stage_type: "REVIEW", next_stage_on_pass: null, is_terminal: false, stage_name: "S2", stage_type: "REVIEW" },
    ];
    pool.query
      .mockResolvedValueOnce({ rows: [baseSR] })
      .mockResolvedValueOnce({ rows: stageDefs });

    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 200 }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await moveToNextStage(1, 1, {});
    expect(result.action).toBe("MOVED");
    expect(result.next_stage_id).toBe(20);
  });

  it("reuses existing next stage record if found", async () => {
    const stageDefs = [
      { id: 10, sequence_order: 1, requires_approval: false, stage_type: "REVIEW", next_stage_on_pass: null, is_terminal: false, stage_name: "S1", stage_type: "REVIEW" },
      { id: 20, sequence_order: 2, requires_approval: false, stage_type: "REVIEW", next_stage_on_pass: null, is_terminal: false, stage_name: "S2", stage_type: "REVIEW" },
    ];
    pool.query
      .mockResolvedValueOnce({ rows: [baseSR] })
      .mockResolvedValueOnce({ rows: stageDefs });

    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 99, assigned_user_id: null, assigned_employee_id: null, scheduled_at: null }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 99 }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await moveToNextStage(1, 1, {});
    expect(result.action).toBe("MOVED");
  });
});

// ---------- failWorkflow ----------
describe("failWorkflow", () => {
  const baseSR = {
    id: 1, workflow_stage_id: 10, workflow_id: 5, applicant_id: 1,
    workflow_instance_id: 100, stage_name: "S1", instance_status: "ACTIVE",
    first_name: "John", last_name: "Doe",
  };

  it("throws if stage record not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(failWorkflow(1, 1, {})).rejects.toThrow("Stage record not found");
  });

  it("fails the workflow, stage record, and applicant", async () => {
    pool.query.mockResolvedValueOnce({ rows: [baseSR] });
    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await failWorkflow(1, 1, {});
    expect(result.action).toBe("FAILED");
    expect(mClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mClient.release).toHaveBeenCalled();
  });
});

// ---------- skipStage ----------
describe("skipStage", () => {
  const baseSR = {
    id: 1, workflow_stage_id: 10, workflow_id: 5, applicant_id: 1,
    workflow_instance_id: 100, stage_name: "S1", allow_skip: true,
    instance_status: "ACTIVE", first_name: "John", last_name: "Doe",
  };

  it("throws if stage record not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(skipStage(1, {})).rejects.toThrow("Stage record not found");
  });

  it("throws if skip not allowed", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...baseSR, allow_skip: false }] });
    await expect(skipStage(1, {})).rejects.toThrow("does not allow skipping");
  });

  it("skips and moves to next stage when available", async () => {
    pool.query.mockResolvedValueOnce({ rows: [baseSR] });
    const stageDefs = [
      { id: 10, sequence_order: 1 },
      { id: 20, sequence_order: 2, stage_name: "S2", stage_type: "REVIEW" },
    ];
    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: stageDefs })
      .mockResolvedValueOnce({ rows: [{ id: 200 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await skipStage(1, {});
    expect(result.action).toBe("SKIPPED_MOVED");
    expect(result.next_stage_name).toBe("S2");
  });

  it("skips without moving if no next stage", async () => {
    pool.query.mockResolvedValueOnce({ rows: [baseSR] });
    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 10, sequence_order: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await skipStage(1, {});
    expect(result.action).toBe("SKIPPED");
  });
});

// ---------- getStageApproval ----------
describe("getStageApproval", () => {
  it("returns null if not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const result = await getStageApproval(1);
    expect(result).toBeNull();
  });

  it("returns approval row", async () => {
    const row = { id: 5, decision: "PENDING" };
    pool.query.mockResolvedValueOnce({ rows: [row] });
    const result = await getStageApproval(1);
    expect(result).toEqual(row);
  });
});

// ---------- createPendingStageApprovalIfNeeded ----------
describe("createPendingStageApprovalIfNeeded", () => {
  it("returns existing approval if found", async () => {
    const existing = { id: 5, decision: "PENDING" };
    pool.query.mockResolvedValueOnce({ rows: [existing] });
    const result = await createPendingStageApprovalIfNeeded(1);
    expect(result).toEqual(existing);
  });

  it("throws if stage record not found", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(createPendingStageApprovalIfNeeded(1)).rejects.toThrow("Stage record not found");
  });

  it("creates new pending approval", async () => {
    const sr = { id: 1, applicant_id: 1, workflow_stage_id: 10, stage_name: "S1", first_name: "John", last_name: "Doe" };
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [sr] })
      .mockResolvedValueOnce({ rows: [{ id: 99 }] });

    const result = await createPendingStageApprovalIfNeeded(1);
    expect(result.id).toBe(99);
  });
});

// ---------- checkApprovalPermission ----------
describe("checkApprovalPermission", () => {
  const currentUser = { id: 1, employee_id: 10, role: "USER" };

  it("does nothing if no approval row", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(checkApprovalPermission(1, currentUser)).resolves.not.toThrow();
  });

  it("does nothing if no assignment on approval", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ assigned_user_id: null, assigned_employee_id: null }] });
    await expect(checkApprovalPermission(1, currentUser)).resolves.not.toThrow();
  });

  it("passes if user is assigned_user_id", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ assigned_user_id: 1, assigned_employee_id: null }] });
    await expect(checkApprovalPermission(1, currentUser)).resolves.not.toThrow();
  });

  it("passes if user is assigned_employee_id", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ assigned_user_id: null, assigned_employee_id: 10 }] });
    await expect(checkApprovalPermission(1, currentUser)).resolves.not.toThrow();
  });

  it("passes if user is ADMIN", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ assigned_user_id: 99, assigned_employee_id: null }] });
    await expect(checkApprovalPermission(1, { ...currentUser, role: "ADMIN" })).resolves.not.toThrow();
  });

  it("passes if user has recruitment.approvals.manage permission", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ assigned_user_id: 99, assigned_employee_id: null }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });
    await expect(checkApprovalPermission(1, currentUser)).resolves.not.toThrow();
  });

  it("throws if not authorized", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ assigned_user_id: 99, assigned_employee_id: null }] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(checkApprovalPermission(1, currentUser)).rejects.toThrow(
      /Only the assigned approver/,
    );
  });
});

// ---------- assignApprovalStage ----------
describe("assignApprovalStage", () => {
  const baseSR = {
    id: 1, workflow_stage_id: 10, workflow_id: 5, applicant_id: 1,
    first_name: "John", last_name: "Doe", stage_name: "Approval",
    instance_status: "ACTIVE",
  };

  it("throws if stage record not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(assignApprovalStage(1, {}, {})).rejects.toThrow("Stage record not found");
  });

  it("throws if stage is not an approval stage", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [baseSR] })
      .mockResolvedValueOnce({ rows: [{ stage_type: "REVIEW", requires_approval: false }] });
    await expect(assignApprovalStage(1, {}, {})).rejects.toThrow("not an approval stage");
  });

  it("updates approval assignment", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [baseSR] })
      .mockResolvedValueOnce({ rows: [{ stage_type: "APPROVAL", requires_approval: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 50 }] })
      .mockResolvedValueOnce({ rows: [{ id: 50, assigned_user_id: 5 }] });

    const result = await assignApprovalStage(1, { assigned_user_id: 5 }, { id: 2, employee_id: 8 });
    expect(result.id).toBe(50);
    expect(notificationService.notify).toHaveBeenCalled();
  });
});

// ---------- getMyApprovalAssignments ----------
describe("getMyApprovalAssignments", () => {
  it("returns rows for user", async () => {
    const rows = [{ id: 1, decision: "PENDING" }];
    pool.query.mockResolvedValueOnce({ rows });
    const result = await getMyApprovalAssignments(1, 10);
    expect(result).toEqual(rows);
  });
});

// ---------- getMyWorkflowStageAssignments ----------
describe("getMyWorkflowStageAssignments", () => {
  it("returns mapped rows with assigned_name", async () => {
    const rows = [{ assigned_first_name: "Jane", assigned_last_name: "Doe" }];
    pool.query.mockResolvedValueOnce({ rows });
    const result = await getMyWorkflowStageAssignments(1, 10);
    expect(result[0].assigned_name).toBe("Jane Doe");
  });

  it("falls back to username when no employee names", async () => {
    const rows = [{ assigned_first_name: null, assigned_last_name: null, assigned_username: "jdoe", assigned_employee_code: null, assigned_user_id: 1 }];
    pool.query.mockResolvedValueOnce({ rows });
    const result = await getMyWorkflowStageAssignments(1, 10);
    expect(result[0].assigned_name).toBe("jdoe");
  });
});

// ---------- getPossibleApprovers ----------
describe("getPossibleApprovers", () => {
  it("returns rows from query", async () => {
    const rows = [{ user_id: 1, employee_name: "John Doe" }];
    pool.query.mockResolvedValueOnce({ rows });
    const result = await getPossibleApprovers();
    expect(result).toEqual(rows);
  });
});

// ---------- getAssignableUsers ----------
describe("getAssignableUsers", () => {
  it("returns paginated data", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1, name: "John" }] })
      .mockResolvedValueOnce({ rows: [{ count: "1" }] });
    const result = await getAssignableUsers(1, 20, "");
    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });
});

// ---------- approveStage ----------
describe("approveStage", () => {
  const baseSR = {
    id: 1, workflow_stage_id: 10, workflow_id: 5, applicant_id: 1,
    stage_name: "Approval", stage_type: "APPROVAL",
    requires_score: false, requires_approval: true,
    is_terminal: false, passing_score: null, allow_skip: false,
    instance_status: "ACTIVE",
    first_name: "John", last_name: "Doe",
  };

  it("throws if stage record not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(approveStage(1, "ok", {})).rejects.toThrow("Stage record not found");
  });

  it("throws if not an approval stage", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...baseSR, stage_type: "REVIEW" }] });
    await expect(approveStage(1, "ok", {})).rejects.toThrow("not an approval stage");
  });

  it("approves stage via transaction", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [baseSR] })
      .mockResolvedValueOnce({ rows: [{ assigned_user_id: null, assigned_employee_id: null }] });
    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 50 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "COMPLETED" }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await approveStage(1, "Approved", { id: 1, employee_id: 5 });
    expect(result.nextAction).toBe("MOVE_NEXT");
  });
});

// ---------- rejectStage ----------
describe("rejectStage", () => {
  const baseSR = {
    id: 1, workflow_stage_id: 10, workflow_id: 5, applicant_id: 1,
    stage_name: "Approval", stage_type: "APPROVAL",
    requires_score: false, requires_approval: true,
    is_terminal: false, passing_score: null, allow_skip: false,
    instance_status: "ACTIVE",
    first_name: "John", last_name: "Doe",
  };

  it("throws if stage record not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(rejectStage(1, "no", {})).rejects.toThrow("Stage record not found");
  });

  it("rejects stage via transaction", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [baseSR] })
      .mockResolvedValueOnce({ rows: [{ assigned_user_id: null, assigned_employee_id: null }] });
    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 50 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "FAILED" }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await rejectStage(1, "Rejected", { id: 1, employee_id: 5 });
    expect(result.nextAction).toBe("FAIL_WORKFLOW");
  });
});

// ---------- rollbackToStage ----------
describe("rollbackToStage", () => {
  it("throws if no reason provided", async () => {
    await expect(rollbackToStage(1, 1, "", {})).rejects.toThrow("Correction reason is required");
  });

  it("throws if applicant not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(rollbackToStage(1, 1, "mistake", {})).rejects.toThrow("Applicant not found");
  });

  it("throws if applicant has no workflow instance", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, workflow_instance_id: null }] });
    await expect(rollbackToStage(1, 1, "mistake", {})).rejects.toThrow("does not have a dynamic workflow instance");
  });

  it("throws if workflow instance not found", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, workflow_instance_id: 99 }] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(rollbackToStage(1, 1, "mistake", {})).rejects.toThrow("Workflow instance not found");
  });

  it("throws if target stage not in workflow", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, workflow_instance_id: 99 }] })
      .mockResolvedValueOnce({ rows: [{ id: 99, workflow_id: 5 }] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(rollbackToStage(1, 1, "mistake", {})).rejects.toThrow("Target stage not found in this workflow");
  });

  it("rolls back to target stage via transaction", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, workflow_instance_id: 99 }] })
      .mockResolvedValueOnce({ rows: [{ id: 99, workflow_id: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: 20, stage_name: "S1", stage_type: "REVIEW" }] });

    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 50, stage_name: "Old", status: "ACTIVE" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 300 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await rollbackToStage(1, 20, "correction needed", {});
    expect(result.action).toBe("ROLLBACK");
    expect(result.target_stage_id).toBe(20);
  });

  it("reuses existing record if found for target stage", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, workflow_instance_id: 99 }] })
      .mockResolvedValueOnce({ rows: [{ id: 99, workflow_id: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: 20, stage_name: "S1", stage_type: "REVIEW" }] });

    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 50 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 200 }] })
      .mockResolvedValueOnce({ rows: [{ id: 200 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await rollbackToStage(1, 20, "fix", {});
    expect(result.action).toBe("ROLLBACK");
  });
});

// ---------- correctStageResult ----------
describe("correctStageResult", () => {
  it("throws if no correction_reason", async () => {
    await expect(correctStageResult(1, {}, {})).rejects.toThrow("Correction reason is required");
  });

  it("throws if stage record not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(correctStageResult(1, { correction_reason: "fix" }, {})).rejects.toThrow("Stage record not found");
  });

  it("throws if no valid fields to correct", async () => {
    const sr = { id: 1, status: "COMPLETED", score: 80 };
    pool.query.mockResolvedValueOnce({ rows: [sr] });
    await expect(correctStageResult(1, { correction_reason: "fix", invalid_field: "x" }, {}))
      .rejects.toThrow("No valid fields to correct");
  });

  it("updates allowed fields and returns result", async () => {
    const sr = { id: 1, status: "COMPLETED", score: 80, recommendation: "PASSED", comments: "good" };
    pool.query.mockResolvedValueOnce({ rows: [sr] });
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: "PENDING", score: 50 }] });

    const result = await correctStageResult(1, { correction_reason: "admin fix", status: "PENDING", score: 50 }, {});
    expect(result.action).toBe("CORRECTED");
    expect(result.old_values.score).toBe(80);
    expect(result.new_values.score).toBe(50);
    expect(result.correction_reason).toBe("admin fix");
  });
});

// ---------- failDynamicApplicant ----------
describe("failDynamicApplicant", () => {
  it("throws if no reason", async () => {
    await expect(failDynamicApplicant(1, "", {})).rejects.toThrow("Failure reason is required");
  });

  it("throws if applicant not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(failDynamicApplicant(1, "bad fit", {})).rejects.toThrow("Applicant not found");
  });

  it("fails the workflow and applicant via transaction", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    mClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await failDynamicApplicant(1, "bad fit", {});
    expect(result.action).toBe("ADMIN_FAILED");
    expect(result.reason).toBe("bad fit");
  });
});
