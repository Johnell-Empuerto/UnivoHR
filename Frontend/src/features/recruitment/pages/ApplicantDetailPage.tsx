import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  approveStageAction,
  rejectStageAction,
  assignApproval,
  getApplicantById,
  getApplicantWorkflowTimeline,
  updateApplicant,
  convertApplicantToEmployee,
  completeWorkflowStage,
  moveToNextWorkflowStage,
  failApplicantWorkflow,
  skipWorkflowStage,
  rollbackApplicantWorkflow,
  correctStageResult,
  failDynamicApplicant,
  createStageRecord,
  updateWorkflowStage,
} from "@/services/applicantService";
import {
  getApplicantInterviews,
  createApplicantInterview,
  updateApplicantInterview,
} from "@/services/applicantInterviewService";

import {
  getApplicantRequirements,
  createApplicantRequirement,
  updateApplicantRequirement,
  deleteApplicantRequirement,
} from "@/services/applicantRequirementService";
import {
  getApplicantFamily,
  createApplicantFamily,
  updateApplicantFamily,
  deleteApplicantFamily,
  getApplicantEducation,
  createApplicantEducation,
  updateApplicantEducation,
  deleteApplicantEducation,
  getApplicantExperience,
  createApplicantExperience,
  updateApplicantExperience,
  deleteApplicantExperience,
} from "@/services/applicantBiodataService";
import { useActiveBranches } from "@/hooks/useBranches";
import { formatDateShort } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import {
  ArrowLeft, Loader2, UserPlus, Plus, Pencil, Trash2, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";
import UserPickerDialog from "@/components/shared/UserPickerDialog";

interface Applicant {
  id: number; job_position_id: number | null; first_name: string; middle_name: string | null;
  last_name: string; suffix: string | null; email: string | null; phone: string | null;
  address: string | null; resume_url: string | null; status: string; rating: string | null;
  source: string | null; notes: string | null; applied_date: string;
  job_title: string | null; job_department: string | null; employee_id: number | null;
  workflow_instance_id: number | null; workflow_name: string | null;
  can_convert_to_employee?: boolean;
}

interface Requirement {
  id: number; applicant_id: number; requirement_name: string;
  status: string; remarks: string | null; verified_date: string | null;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Initial: getStatusBadgeClass("info"),
    Pending: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    "Final Interview": getStatusBadgeClass("warning"),
    "Exam Interview": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    Completed: getStatusBadgeClass("success"),
    Fail: getStatusBadgeClass("danger"),
  };
  return <Badge className={map[status] || getStatusBadgeClass("neutral")}>{status}</Badge>;
};

const reqStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    Pending: getStatusBadgeClass("neutral"),
    Completed: getStatusBadgeClass("success"),
    Rejected: getStatusBadgeClass("danger"),
  };
  return <Badge className={map[status] || getStatusBadgeClass("neutral")}>{status}</Badge>;
};

const ApplicantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();

  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const { data: branches = [] } = useActiveBranches();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ status: "", rating: "", notes: "" });

  const [convertDialog, setConvertDialog] = useState(false);
  const [convertForm, setConvertForm] = useState({
    branch_id: "",
    hired_date: new Date().toISOString().split("T")[0],
    probation_period_months: "",
    employee_code: "",
  });
  const [converting, setConverting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reqDialog, setReqDialog] = useState(false);
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);
  const [reqForm, setReqForm] = useState({ requirement_name: "", status: "Pending", remarks: "" });

  const [familyOpen, setFamilyOpen] = useState(false);
  const [familyData, setFamilyData] = useState<any[]>([]);
  const [familyDialog, setFamilyDialog] = useState<{ open: boolean; mode: "create" | "edit"; item: any }>({ open: false, mode: "create", item: null });
  const [editingFamily, setEditingFamily] = useState<any>({});

  const [educationOpen, setEducationOpen] = useState(false);
  const [educationData, setEducationData] = useState<any[]>([]);
  const [educationDialog, setEducationDialog] = useState<{ open: boolean; mode: "create" | "edit"; item: any }>({ open: false, mode: "create", item: null });
  const [editingEducation, setEditingEducation] = useState<any>({});

  const [experienceOpen, setExperienceOpen] = useState(false);
  const [experienceData, setExperienceData] = useState<any[]>([]);
  const [experienceDialog, setExperienceDialog] = useState<{ open: boolean; mode: "create" | "edit"; item: any }>({ open: false, mode: "create", item: null });
  const [editingExperience, setEditingExperience] = useState<any>({});

  const [interviews, setInterviews] = useState<any[]>([]);

  const [interviewDialog, setInterviewDialog] = useState<{ open: boolean; mode: "create" | "edit"; item: any }>({ open: false, mode: "create", item: null });
  const [interviewForm, setInterviewForm] = useState<any>({
    interview_type: "Initial Interview",
    interviewer_user_id: "",
    interview_date: "",
    status: "SCHEDULED",
    rating: "",
    recommendation: "",
    notes: "",
  });
  const [savingInterview, setSavingInterview] = useState(false);

  const [stageConfirm, setStageConfirm] = useState<{
    open: boolean;
    suggestedStage: string;
    interviewType: string;
  }>({ open: false, suggestedStage: "", interviewType: "" });



  const [workflowTimeline, setWorkflowTimeline] = useState<any>(null);
  const [workflowTimelineLoading, setWorkflowTimelineLoading] = useState(false);

  const [stageActionDialog, setStageActionDialog] = useState<{ open: boolean; stage: any; stageRecord: any }>({ open: false, stage: null, stageRecord: null });
  const [stageActionForm, setStageActionForm] = useState({ score: "", recommendation: "", comments: "" });
  const [stageActionProcessing, setStageActionProcessing] = useState(false);

  const [stageProgression, setStageProgression] = useState<{ open: boolean; stageRecordId: number | null; action: "MOVE_NEXT" | "FAIL_WORKFLOW" | "SKIP" | null; skipOnly: boolean }>({ open: false, stageRecordId: null, action: null, skipOnly: false });
  const [progressionProcessing, setProgressionProcessing] = useState(false);

  const [dynApprovalRemarks, setDynApprovalRemarks] = useState("");
  const [dynApprovalProcessing, setDynApprovalProcessing] = useState(false);
  const [dynApprovalConfirm, setDynApprovalConfirm] = useState<{
    open: boolean;
    action: "APPROVE" | "REJECT";
    stageRecordId: number | null;
    stageName: string;
  }>({ open: false, action: "APPROVE", stageRecordId: null, stageName: "" });

  const [assignApprovalDialog, setAssignApprovalDialog] = useState<{
    open: boolean;
    stageRecordId: number | null;
    stageName: string;
  }>({ open: false, stageRecordId: null, stageName: "" });
  const [assignApprovalForm, setAssignApprovalForm] = useState({
    assigned_user_id: "",
    scheduled_at: "",
    comments: "",
  });
  const [assignApprovalProcessing, setAssignApprovalProcessing] = useState(false);

  const [adminCorrectionDialog, setAdminCorrectionDialog] = useState<{
    open: boolean; correctionType: "ROLLBACK" | "CORRECT_RESULT" | "FAIL" | null;
    targetStageId: string; stageRecordId: string; status: string; score: string;
    recommendation: string; reason: string;
  }>({ open: false, correctionType: null, targetStageId: "", stageRecordId: "", status: "", score: "", recommendation: "", reason: "" });
  const [adminCorrectionProcessing, setAdminCorrectionProcessing] = useState(false);

  const [scheduleDialog, setScheduleDialog] = useState<{
    open: boolean; stageRecordId: number | null; stageName: string;
    stage_type: string; applicant_id: number;
    assigned_user_id: string; assigned_employee_id: string;
    scheduled_at: string; comments: string;
  }>({ open: false, stageRecordId: null, stageName: "", stage_type: "", applicant_id: 0, assigned_user_id: "none", assigned_employee_id: "", scheduled_at: "", comments: "" });
  const [scheduleProcessing, setScheduleProcessing] = useState(false);

  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [userPickerTarget, setUserPickerTarget] = useState<"interview" | "schedule" | "approval">("interview");
  const [userPickerTitle, setUserPickerTitle] = useState("Select User");
  const [interviewUserData, setInterviewUserData] = useState<any>(null);
  const [scheduleUserData, setScheduleUserData] = useState<any>(null);
  const [approvalUserData, setApprovalUserData] = useState<any>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean; title: string; message: string; onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const hasApprovedApproval = workflowTimeline?.stages?.some((s: any) => s.stage_type === "APPROVAL" && s.approval_decision === "APPROVED");

  const getSuggestedStageFromInterview = (interviewType: string, recommendation: string): string | null => {
    if (recommendation === "FAILED") return "Fail";
    if (recommendation === "FOR_REVIEW") return null;
    if (recommendation !== "PASSED") return null;
    const map: Record<string, string> = {
      "Initial Interview": "Exam Interview",
      "Exam Interview": "Final Interview",
      "Final Interview": "Completed",
    };
    return map[interviewType] || null;
  };

  const hasInterviewRecord = (stageKey: string) => {
    const stageLabels: Record<string, string> = {
      initial: "Initial Interview",
      exam: "Exam Interview",
      final: "Final Interview",
    };
    const label = stageLabels[stageKey];
    if (!label) return false;
    return interviews.some((iv: any) => iv.interview_type === label);
  };

  const getStageInfo = () => {
    const stages = [
      { key: "applied", label: "Applied" },
      { key: "initial", label: "Initial Interview" },
      { key: "exam", label: "Exam Interview" },
      { key: "final", label: "Final Interview" },
      { key: "approval", label: "Approval" },
      { key: "converted", label: "Employee" },
    ];

    const status = (applicant?.status || "").toUpperCase();
    const isFailed = ["REJECTED", "WITHDRAWN", "FAIL"].some(s => status.includes(s));
    const isHired = status === "HIRED" || !!applicant?.employee_id;

    let currentIdx: number;
    if (isHired) {
      currentIdx = 5;
    } else if (["APPROVED", "COMPLETED", "FOR_APPROVAL"].some(s => status.includes(s))) {
      currentIdx = 4;
    } else if (status.includes("FINAL")) {
      currentIdx = 3;
    } else if (status.includes("EXAM")) {
      currentIdx = 2;
    } else if (status.includes("INITIAL")) {
      currentIdx = 1;
    } else {
      currentIdx = 0;
    }

    const statuses: ("completed" | "current" | "future" | "failed")[] = [];
    const recordStatuses: ("recorded" | "manual" | "none")[] = [];
    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];
      if (i < currentIdx) {
        statuses.push("completed");
      } else if (i === currentIdx) {
        statuses.push(isFailed ? "failed" : "current");
      } else {
        statuses.push("future");
      }

      if (i === 0) {
        recordStatuses.push("none");
      } else if (s.key === "initial" || s.key === "exam" || s.key === "final") {
        recordStatuses.push(hasInterviewRecord(s.key) ? "recorded" : ("manual"));
      } else if (s.key === "approval") {
        recordStatuses.push("manual");
      } else if (s.key === "converted") {
        recordStatuses.push(applicant?.employee_id ? "recorded" : "none");
      } else {
        recordStatuses.push("none");
      }
    }

    const currentStage = isFailed ? "Failed" : stages[currentIdx].label;
    const completedCount = isFailed ? currentIdx : currentIdx + 1;

    return { stages, statuses, recordStatuses, currentStage, completedCount, total: stages.length };
  };

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [app, reqs, ivs] = await Promise.all([
        getApplicantById(Number(id)),
        getApplicantRequirements(Number(id)).catch(() => []),
        getApplicantInterviews(Number(id)).catch(() => []),
      ]);
      setApplicant(app);
      setRequirements(reqs);
      setInterviews(ivs);
      setEditForm({ status: app.status, rating: app.rating || "", notes: app.notes || "" });
      if (app.workflow_instance_id) {
        setWorkflowTimelineLoading(true);
        getApplicantWorkflowTimeline(Number(id)).then(setWorkflowTimeline).catch(() => setWorkflowTimeline(null)).finally(() => setWorkflowTimelineLoading(false));
      } else {
        setWorkflowTimeline(null);
      }
    } catch (err: any) {
      toast.error("Failed to load applicant details");
      navigate("/recruitment/applicants");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      const reqs = await getApplicantRequirements(Number(id));
      setRequirements(reqs);
    } catch {
      setRequirements([]);
    }
  };

  const loadFamily = async () => {
    if (!id) return;
    try { setFamilyData(await getApplicantFamily(Number(id))); } catch { /* silent */ }
  };

  const loadEducation = async () => {
    if (!id) return;
    try { setEducationData(await getApplicantEducation(Number(id))); } catch { /* silent */ }
  };

  const loadExperience = async () => {
    if (!id) return;
    try { setExperienceData(await getApplicantExperience(Number(id))); } catch { /* silent */ }
  };

  useEffect(() => { if (id) { loadFamily(); loadEducation(); loadExperience(); } }, [id]);

  const handleCreateFamily = async () => {
    if (!id) return;
    try {
      await createApplicantFamily(Number(id), editingFamily);
      toast.success("Family member added");
      setFamilyDialog({ open: false, mode: "create", item: null });
      setEditingFamily({});
      loadFamily();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateFamily = async () => {
    if (!id || !familyDialog.item) return;
    try {
      await updateApplicantFamily(Number(id), familyDialog.item.id, editingFamily);
      toast.success("Family member updated");
      setFamilyDialog({ open: false, mode: "create", item: null });
      setEditingFamily({});
      loadFamily();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteFamily = async (memberId: number) => {
    if (!id) return;
    setDeleteConfirm({
      open: true, title: "Delete Family Member", message: "Are you sure you want to delete this family member?",
      onConfirm: async () => {
        try {
          await deleteApplicantFamily(Number(id), memberId);
          toast.success("Family member deleted");
          loadFamily();
        } catch (err: any) { toast.error(err.message); }
        setDeleteConfirm({ open: false, title: "", message: "", onConfirm: () => {} });
      },
    });
  };

  const handleCreateEducation = async () => {
    if (!id) return;
    try {
      await createApplicantEducation(Number(id), editingEducation);
      toast.success("Education record added");
      setEducationDialog({ open: false, mode: "create", item: null });
      setEditingEducation({});
      loadEducation();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateEducation = async () => {
    if (!id || !educationDialog.item) return;
    try {
      await updateApplicantEducation(Number(id), educationDialog.item.id, editingEducation);
      toast.success("Education record updated");
      setEducationDialog({ open: false, mode: "create", item: null });
      setEditingEducation({});
      loadEducation();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteEducation = async (eduId: number) => {
    if (!id) return;
    setDeleteConfirm({
      open: true, title: "Delete Education Record", message: "Are you sure you want to delete this education record?",
      onConfirm: async () => {
        try {
          await deleteApplicantEducation(Number(id), eduId);
          toast.success("Education record deleted");
          loadEducation();
        } catch (err: any) { toast.error(err.message); }
        setDeleteConfirm({ open: false, title: "", message: "", onConfirm: () => {} });
      },
    });
  };

  const handleCreateExperience = async () => {
    if (!id) return;
    try {
      await createApplicantExperience(Number(id), editingExperience);
      toast.success("Work experience added");
      setExperienceDialog({ open: false, mode: "create", item: null });
      setEditingExperience({});
      loadExperience();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateExperience = async () => {
    if (!id || !experienceDialog.item) return;
    try {
      await updateApplicantExperience(Number(id), experienceDialog.item.id, editingExperience);
      toast.success("Work experience updated");
      setExperienceDialog({ open: false, mode: "create", item: null });
      setEditingExperience({});
      loadExperience();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteExperience = async (expId: number) => {
    if (!id) return;
    setDeleteConfirm({
      open: true, title: "Delete Work Experience", message: "Are you sure you want to delete this work experience?",
      onConfirm: async () => {
        try {
          await deleteApplicantExperience(Number(id), expId);
          toast.success("Work experience deleted");
          loadExperience();
        } catch (err: any) { toast.error(err.message); }
        setDeleteConfirm({ open: false, title: "", message: "", onConfirm: () => {} });
      },
    });
  };

  const handleSaveDetails = async () => {
    try {
      setSaving(true);
      await updateApplicant(Number(id), editForm);
      toast.success("Applicant updated");
      setEditDialog(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddReq = () => {
    setEditingReq(null);
    setReqForm({ requirement_name: "", status: "Pending", remarks: "" });
    setReqDialog(true);
  };

  const handleOpenEditReq = (req: Requirement) => {
    setEditingReq(req);
    setReqForm({
      requirement_name: req.requirement_name,
      status: req.status,
      remarks: req.remarks || "",
    });
    setReqDialog(true);
  };

  const handleSaveReq = async () => {
    if (!reqForm.requirement_name.trim()) {
      toast.error("Requirement name is required");
      return;
    }
    try {
      setSaving(true);
      if (editingReq) {
        await updateApplicantRequirement(Number(id), editingReq.id, reqForm);
        toast.success("Requirement updated");
      } else {
        await createApplicantRequirement(Number(id), reqForm);
        toast.success("Requirement added");
      }
      setReqDialog(false);
      fetchRequirements();
    } catch (err: any) {
      toast.error(err.message || "Failed to save requirement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReq = async (reqId: number) => {
    setDeleteConfirm({
      open: true, title: "Delete Requirement", message: "Are you sure you want to delete this requirement?",
      onConfirm: async () => {
        try {
          await deleteApplicantRequirement(Number(id), reqId);
          toast.success("Requirement deleted");
          fetchRequirements();
        } catch (err: any) { toast.error(err.message || "Delete failed"); }
        setDeleteConfirm({ open: false, title: "", message: "", onConfirm: () => {} });
      },
    });
  };

  const handleReqStatus = async (req: Requirement, newStatus: string) => {
    try {
      await updateApplicantRequirement(Number(id), req.id, {
        requirement_name: req.requirement_name,
        status: newStatus,
        remarks: req.remarks || "",
      });
      toast.success(`Requirement marked as ${newStatus}`);
      fetchRequirements();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleConvertClick = async () => {
    if (!applicant?.can_convert_to_employee && !hasApprovedApproval) {
      toast.error("Approval is still pending. Conversion is blocked until approval is approved.");
      return;
    }
    const uncompleted = requirements.filter((r) => r.status !== "Completed");
    if (requirements.length > 0 && uncompleted.length > 0) {
      const proceed = confirm(
        "Some requirements are not yet completed. Continue converting this applicant?",
      );
      if (!proceed) return;
    }
    setConvertDialog(true);
  };

  const handleConvert = async () => {
    try {
      setConverting(true);
      const result = await convertApplicantToEmployee(Number(id), convertForm);
      toast.success(result.message || "Applicant converted to employee successfully!");
      setConvertDialog(false);
      fetchAll();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to convert applicant.";
      if (message.includes("already been converted")) {
        toast.error("This applicant has already been converted to an employee.");
      } else if (message.includes("Completed")) {
        toast.error("Applicant must be marked Completed before converting.");
      } else if (message.includes("requirements") || message.includes("approval")) {
        toast.error(message);
      } else {
        toast.error(message);
      }
      fetchAll();
    } finally {
      setConverting(false);
    }
  };

  const handleOpenScheduleInterview = () => {
    if (!applicant) return;
    setInterviewForm({
      interview_type: "Initial Interview",
      workflow_stage_id: applicant.workflow_instance_id && workflowTimeline?.stages?.length ? String(workflowTimeline.stages.find((s: any) => s.is_current)?.workflow_stage_id || workflowTimeline.stages[0].workflow_stage_id) : "",
      interviewer_user_id: "",
      interview_date: new Date().toISOString().slice(0, 16),
      status: "SCHEDULED",
      rating: "",
      recommendation: "",
      notes: "",
    });
    setInterviewDialog({ open: true, mode: "create", item: null });
  };

  const handleOpenEditInterview = (iv: any) => {
    setInterviewForm({
      interview_type: iv.interview_type || "Initial Interview",
      interviewer_user_id: iv.interviewer_user_id || "",
      interview_date: iv.interview_date ? iv.interview_date.slice(0, 16) : "",
      status: iv.status || "SCHEDULED",
      rating: iv.rating ?? "",
      recommendation: iv.recommendation || "",
      notes: iv.notes || "",
    });
    setInterviewDialog({ open: true, mode: "edit", item: iv });
  };

  const handleSaveInterview = async () => {
    if (!applicant) return;
    if (!interviewForm.interview_date) {
      toast.error("Date is required");
      return;
    }
    if (applicant.workflow_instance_id && !interviewForm.workflow_stage_id) {
      toast.error("Workflow stage is required");
      return;
    }
    try {
      setSavingInterview(true);
      if (applicant.workflow_instance_id) {
        const payload: any = {
          scheduled_at: interviewForm.interview_date,
          status: interviewForm.status || "SCHEDULED",
          comments: interviewForm.notes || null,
        };
        if (interviewForm.interviewer_user_id) {
          payload.assigned_user_id = Number(interviewForm.interviewer_user_id);
          if (interviewUserData?.employee_id) payload.assigned_employee_id = Number(interviewUserData.employee_id);
        }
        await createStageRecord(Number(id), Number(interviewForm.workflow_stage_id), payload);
        toast.success("Workflow stage scheduled");
        setInterviewDialog({ open: false, mode: "create", item: null });
        fetchAll();
      } else {
        const payload: any = {
          interview_type: interviewForm.interview_type,
          interview_date: interviewForm.interview_date,
          status: interviewForm.status,
          notes: interviewForm.notes || null,
          rating: interviewForm.rating === "" || interviewForm.rating === null ? null : Number(interviewForm.rating),
          recommendation: interviewForm.recommendation || null,
          interviewer_user_id: interviewForm.interviewer_user_id ? Number(interviewForm.interviewer_user_id) : null,
        };
        if (interviewDialog.mode === "create") {
          await createApplicantInterview(Number(id), payload);
          toast.success("Interview scheduled");
          setInterviewDialog({ open: false, mode: "create", item: null });
          fetchAll();
        } else {
          const updated = await updateApplicantInterview(interviewDialog.item.id, payload);
          setInterviewDialog({ open: false, mode: "create", item: null });
          const rec = updated.recommendation || payload.recommendation;
          const it = interviewForm.interview_type;
          const suggested = getSuggestedStageFromInterview(it, rec);
          if (rec === "FOR_REVIEW") {
            toast.success("Interview marked for review. Applicant stage unchanged.");
            fetchAll();
          } else if (suggested) {
            setStageConfirm({ open: true, suggestedStage: suggested, interviewType: it });
          } else {
            toast.success("Interview updated");
            fetchAll();
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to save");
    } finally {
      setSavingInterview(false);
    }
  };

  const handleConfirmStageUpdate = async () => {
    if (!stageConfirm.suggestedStage) return;
    try {
      await updateApplicant(Number(id), { status: stageConfirm.suggestedStage });
      toast.success(
        stageConfirm.suggestedStage === "Fail"
          ? "Applicant marked as Fail."
          : `Applicant moved to ${stageConfirm.suggestedStage}.`,
      );
      setStageConfirm({ open: false, suggestedStage: "", interviewType: "" });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to update applicant stage");
      setStageConfirm({ open: false, suggestedStage: "", interviewType: "" });
    }
  };

  const handleCancelStageUpdate = () => {
    toast.success("Interview result saved. Applicant stage unchanged.");
    setStageConfirm({ open: false, suggestedStage: "", interviewType: "" });
    fetchAll();
  };

  const handleStageActionComplete = async () => {
    if (!stageActionDialog.stageRecord?.id) {
      toast.error("No stage record found. Refresh the page.");
      return;
    }
    if (stageActionDialog.stage?.requires_score && !stageActionForm.score) {
      toast.error("Score is required for this stage");
      return;
    }
    if (stageActionDialog.stage?.stage_type === "APPROVAL" && !stageActionForm.recommendation) {
      toast.error("Approval decision is required");
      return;
    }
    try {
      setStageActionProcessing(true);
      const payload: any = {};
      if (stageActionForm.score) payload.score = Number(stageActionForm.score);
      if (stageActionForm.recommendation) payload.recommendation = stageActionForm.recommendation;
      if (stageActionForm.comments) payload.comments = stageActionForm.comments;
      const result = await completeWorkflowStage(stageActionDialog.stageRecord.id, payload);
      setStageActionDialog({ open: false, stage: null, stageRecord: null });
      if (result.nextAction === "FAIL_WORKFLOW") {
        setStageProgression({ open: true, stageRecordId: stageActionDialog.stageRecord.id, action: "FAIL_WORKFLOW", skipOnly: false });
      } else if (result.nextAction === "MOVE_NEXT") {
        setStageProgression({ open: true, stageRecordId: stageActionDialog.stageRecord.id, action: "MOVE_NEXT", skipOnly: false });
      } else if (result.nextAction === "REVIEW") {
        toast.success("Stage saved for review.");
        fetchAll();
      } else {
        toast.success("Stage completed");
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to complete stage");
    } finally {
      setStageActionProcessing(false);
    }
  };

  const handleStageProgression = async () => {
    if (!stageProgression.stageRecordId) return;
    try {
      setProgressionProcessing(true);
      const numericId = Number(id);
      if (stageProgression.action === "MOVE_NEXT") {
        const result = await moveToNextWorkflowStage(numericId, stageProgression.stageRecordId);
        if (result.action === "WORKFLOW_COMPLETED") {
          toast.success("Workflow completed!");
        } else {
          toast.success(`Moved to next stage: ${result.next_stage_name}`);
        }
      } else if (stageProgression.action === "FAIL_WORKFLOW") {
        await failApplicantWorkflow(numericId, stageProgression.stageRecordId);
        toast.success("Workflow failed");
      } else if (stageProgression.action === "SKIP") {
        const result = await skipWorkflowStage(stageProgression.stageRecordId);
        toast.success(result.next_stage_name ? `Stage skipped. Moved to: ${result.next_stage_name}` : "Stage skipped");
      }
      setStageProgression({ open: false, stageRecordId: null, action: null, skipOnly: false });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Progression failed");
    } finally {
      setProgressionProcessing(false);
    }
  };

  const handleOpenAssignApproval = (stageRecordId: number, stageName: string) => {
    setAssignApprovalForm({ assigned_user_id: "", scheduled_at: "", comments: "" });
    setAssignApprovalDialog({ open: true, stageRecordId, stageName });
  };

  const handleAssignApproval = async () => {
    if (!assignApprovalDialog.stageRecordId) return;
    if (!assignApprovalForm.assigned_user_id) {
      toast.error("Please select an approver");
      return;
    }
    try {
      setAssignApprovalProcessing(true);
      await assignApproval(assignApprovalDialog.stageRecordId, {
        assigned_user_id: Number(assignApprovalForm.assigned_user_id),
        scheduled_at: assignApprovalForm.scheduled_at || undefined,
        comments: assignApprovalForm.comments || undefined,
      });
      toast.success("Approval assigned successfully");
      setAssignApprovalDialog({ open: false, stageRecordId: null, stageName: "" });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to assign approval");
    } finally {
      setAssignApprovalProcessing(false);
    }
  };

  const handleDynApprovalConfirm = async () => {
    if (!dynApprovalConfirm.stageRecordId) return;
    try {
      setDynApprovalProcessing(true);
      if (dynApprovalConfirm.action === "APPROVE") {
        await approveStageAction(dynApprovalConfirm.stageRecordId, dynApprovalRemarks || undefined);
        toast.success(`${dynApprovalConfirm.stageName} approved. Move to the next stage?`);
      } else {
        await rejectStageAction(dynApprovalConfirm.stageRecordId, dynApprovalRemarks || undefined);
        toast.error(`${dynApprovalConfirm.stageName} rejected.`);
      }
      setDynApprovalConfirm({ open: false, action: "APPROVE", stageRecordId: null, stageName: "" });
      setDynApprovalRemarks("");
      if (dynApprovalConfirm.action === "APPROVE") {
        setStageProgression({ open: true, stageRecordId: dynApprovalConfirm.stageRecordId, action: "MOVE_NEXT", skipOnly: false });
      } else {
        setStageProgression({ open: true, stageRecordId: dynApprovalConfirm.stageRecordId, action: "FAIL_WORKFLOW", skipOnly: false });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Approval action failed");
    } finally {
      setDynApprovalProcessing(false);
    }
  };

  const toDateTimeLocalValue = (value: string | null | undefined) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleOpenSchedule = (stage: any) => {
    if (!stage.stage_record_id) { toast.error("No stage record to schedule"); return; }
    setScheduleDialog({
      open: true,
      stageRecordId: stage.stage_record_id,
      stageName: stage.stage_name,
      stage_type: stage.stage_type,
      applicant_id: Number(id),
      assigned_user_id: stage.assigned_user_id ? String(stage.assigned_user_id) : "none",
      assigned_employee_id: stage.assigned_employee_id ? String(stage.assigned_employee_id) : "",
      scheduled_at: toDateTimeLocalValue(stage.scheduled_at),
      comments: stage.comments || "",
    });
  };

  const handleSaveSchedule = async () => {
    const dlg = scheduleDialog;
    if (!dlg.stageRecordId) { toast.error("No stage record to update"); return; }
    try {
      setScheduleProcessing(true);
      const payload: any = {
        scheduled_at: dlg.scheduled_at || null,
        comments: dlg.comments || null,
      };
      if (dlg.assigned_user_id && dlg.assigned_user_id !== "none") {
        payload.assigned_user_id = Number(dlg.assigned_user_id);
        if (scheduleUserData?.employee_id) payload.assigned_employee_id = Number(scheduleUserData.employee_id);
      } else {
        payload.assigned_user_id = null;
        payload.assigned_employee_id = null;
      }
      if (dlg.scheduled_at) {
        payload.status = "SCHEDULED";
      } else {
        payload.status = "PENDING";
      }
      await updateWorkflowStage(dlg.stageRecordId, payload);
      toast.success("Schedule updated");
      setScheduleDialog({ open: false, stageRecordId: null, stageName: "", stage_type: "", applicant_id: 0, assigned_user_id: "none", assigned_employee_id: "", scheduled_at: "", comments: "" });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to update schedule");
    } finally {
      setScheduleProcessing(false);
    }
  };

  const handleAdminCorrection = async () => {
    const dlg = adminCorrectionDialog;
    if (!dlg.reason.trim()) { toast.error("Correction reason is required"); return; }
    try {
      setAdminCorrectionProcessing(true);
      if (dlg.correctionType === "ROLLBACK") {
        if (!dlg.targetStageId) { toast.error("Target stage is required"); return; }
        await rollbackApplicantWorkflow(Number(id), Number(dlg.targetStageId), dlg.reason);
        toast.success("Workflow corrected successfully.");
      } else if (dlg.correctionType === "CORRECT_RESULT") {
        if (!dlg.stageRecordId) { toast.error("Stage record is required"); return; }
        const payload: any = { correction_reason: dlg.reason };
        if (dlg.status) payload.status = dlg.status;
        if (dlg.score) payload.score = Number(dlg.score);
        if (dlg.recommendation) payload.recommendation = dlg.recommendation;
        await correctStageResult(Number(dlg.stageRecordId), payload);
        toast.success("Stage result corrected.");
      } else if (dlg.correctionType === "FAIL") {
        await failDynamicApplicant(Number(id), dlg.reason);
        toast.success("Applicant marked as failed.");
      }
      setAdminCorrectionDialog({ open: false, correctionType: null, targetStageId: "", stageRecordId: "", status: "", score: "", recommendation: "", reason: "" });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Correction failed");
    } finally {
      setAdminCorrectionProcessing(false);
    }
  };

  if (loading) {
    return <Loader fullPage />;
  }
  if (!applicant) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/recruitment/applicants")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            {applicant.first_name} {applicant.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">{applicant.job_title || "No position assigned"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {statusBadge(applicant.status)}
          {applicant.workflow_instance_id ? (
            <Badge className={getStatusBadgeClass("info")}>Dynamic Workflow</Badge>
          ) : (
            <Badge className={getStatusBadgeClass("neutral")}>Legacy Applicant</Badge>
          )}
          {applicant.employee_id && (
            <Badge className={getStatusBadgeClass("success") + " flex items-center gap-1"}>
              <UserPlus className="h-3 w-3" /> Converted to Employee
            </Badge>
          )}
          {hasPermission("recruitment.applicants.manage") && (applicant.can_convert_to_employee || (applicant.status === "Completed" && !applicant.employee_id)) && (
            <Button
              size="sm"
              onClick={handleConvertClick}
              disabled={!applicant.can_convert_to_employee && !hasApprovedApproval}
              className="flex items-center gap-1"
              title={!applicant.can_convert_to_employee && !hasApprovedApproval ? "Approval is still pending. Conversion is blocked until approval is approved." : undefined}
            >
              <UserPlus className="h-4 w-4" /> Convert to Employee
            </Button>
          )}

        </div>
      </div>

      {!applicant.workflow_instance_id && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 dark:bg-gray-900/30 dark:border-gray-700 dark:text-gray-400">
          <strong>Legacy applicant.</strong> This applicant was created before dynamic workflow mode. Admin may migrate this applicant if needed. Dynamic approval scheduling is not available.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {applicant.first_name} {applicant.middle_name || ""} {applicant.last_name}{applicant.suffix ? ", " + applicant.suffix : ""}</p>
            <p><span className="text-muted-foreground">Email:</span> {applicant.email || "-"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {applicant.phone || "-"}</p>
            <p><span className="text-muted-foreground">Address:</span> {applicant.address || "-"}</p>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Application Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Position:</span> {applicant.job_title || "-"}</p>
            <p><span className="text-muted-foreground">Department:</span> {applicant.job_department || "-"}</p>
            <p><span className="text-muted-foreground">Applied:</span> {applicant.applied_date ? formatDateShort(applicant.applied_date) : "-"}</p>
            <p><span className="text-muted-foreground">Source:</span> {applicant.source || "-"}</p>
            <p><span className="text-muted-foreground">Rating:</span> {applicant.rating || "-"}</p>
            {applicant.workflow_instance_id && workflowTimeline ? (
              <>
                <p><span className="text-muted-foreground">Workflow:</span> {workflowTimeline.workflow_name || "-"}</p>
                <p><span className="text-muted-foreground">Instance Status:</span> <span className="font-semibold text-blue-700">{workflowTimeline.instance_status || "-"}</span></p>
                <p><span className="text-muted-foreground">Current Stage:</span>{" "}
                  <span className="font-semibold text-blue-700">
                    {workflowTimeline.stages?.find((s: any) => s.is_current)?.stage_name || workflowTimeline.stages?.[0]?.stage_name || "-"}
                  </span>
                </p>
                <p><span className="text-muted-foreground">Progress:</span> {workflowTimeline.stages?.filter((s: any) => s.status === "COMPLETED").length || 0} / {workflowTimeline.stages?.length || 0} Stages</p>
              </>
            ) : (
              <>
                <p><span className="text-muted-foreground">Current Recruitment Stage:</span>{" "}
                  <span className={"font-semibold " + (getStageInfo().currentStage === "Failed" ? "text-red-600" : "text-blue-700")}>{getStageInfo().currentStage}</span>
                </p>
                <p><span className="text-muted-foreground">Progress:</span> {getStageInfo().completedCount} / {getStageInfo().total} Stages Completed</p>
              </>
            )}
            {applicant.notes && <p><span className="text-muted-foreground">Notes:</span> {applicant.notes}</p>}
          </CardContent>
        </Card>
      </div>

      {applicant.workflow_instance_id && workflowTimeline ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dynamic Recruitment Workflow</CardTitle>
            <p className="text-sm text-muted-foreground">
              Workflow: {workflowTimeline.workflow_name || "-"} &middot;
              Status: {workflowTimeline.instance_status || "-"}
            </p>
          </CardHeader>
          <CardContent>
            {workflowTimelineLoading ? (
              <Loader message="Loading timeline..." />
            ) : workflowTimeline.stages && workflowTimeline.stages.length > 0 ? (
              <div className="flex items-center">
                {workflowTimeline.stages.map((stage: any, i: number) => {
                  const isCompleted = stage.status === "COMPLETED";
                  const isCurrent = stage.is_current;
                  const isFailed = stage.status === "FAILED" || stage.status === "CANCELLED";
                  const connectorColor = isCompleted ? "bg-green-500" : isCurrent ? "bg-blue-400" : isFailed ? "bg-red-400" : "bg-gray-200";
                  return (
                    <div key={stage.workflow_stage_id} className="flex items-center flex-1 min-w-0">
                      {i > 0 && (
                        <div className={"flex-1 h-0.5 mr-1 " + connectorColor} />
                      )}
                      <div className="flex flex-col items-center">
                        <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 " + (
                          isCompleted ? "bg-green-500 border-green-500 text-white" :
                          isCurrent ? "border-blue-500 bg-blue-50 text-blue-700" :
                          isFailed ? "border-red-500 bg-red-50 text-red-600" :
                          "border-gray-300 bg-gray-50 text-gray-400"
                        )}>
                          {isCompleted ? "✓" : isFailed ? "✕" : i + 1}
                        </div>
                        <span className={"text-[11px] mt-1 text-center leading-tight " + (
                          isCompleted ? "text-green-700 font-medium" :
                          isCurrent ? "text-blue-700 font-medium" :
                          isFailed ? "text-red-600 font-medium" :
                          "text-gray-400"
                        )}>
                          {stage.stage_name}
                        </span>
                        {stage.stage_type && (
                          <span className="text-[9px] mt-0.5 px-1 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 leading-tight">{stage.stage_type}</span>
                        )}
                        {isCurrent && !isCompleted && (
                          <span className="text-[9px] mt-0.5 px-1 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 leading-tight">current</span>
                        )}
                        {isCurrent && !isCompleted && stage.stage_type === "APPROVAL" && stage.requires_approval && (
                          <div className="mt-2 flex flex-col gap-1 items-center">
                            {stage.approval_decision === "APPROVED" ? (
                              <>
                                <span className="text-[9px] px-1 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">APPROVED</span>
                                {stage.approval_approver_name && <span className="text-[9px] text-green-700 dark:text-green-400">by {stage.approval_approver_name}</span>}
                                {hasPermission("recruitment.applicants.manage") && workflowTimeline.instance_status === "ACTIVE" && (
                                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-green-600"
                                    onClick={() => stage.stage_record_id && setStageProgression({ open: true, stageRecordId: stage.stage_record_id, action: "MOVE_NEXT", skipOnly: false })}>
                                    Move to Next
                                  </Button>
                                )}
                              </>
                            ) : stage.approval_decision === "REJECTED" ? (
                              <>
                                <span className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">REJECTED</span>
                                {stage.approval_approver_name && <span className="text-[9px] text-red-700 dark:text-red-400">by {stage.approval_approver_name}</span>}
                                {hasPermission("recruitment.applicants.manage") && workflowTimeline.instance_status === "ACTIVE" && (
                                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-red-600"
                                    onClick={() => stage.stage_record_id && setStageProgression({ open: true, stageRecordId: stage.stage_record_id, action: "FAIL_WORKFLOW", skipOnly: false })}>
                                    Fail Workflow
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">PENDING</span>
                                {stage.approval_assignee_name && (
                                  <span className="text-[9px] text-muted-foreground">Assigned to: {stage.approval_assignee_name}</span>
                                )}
                                {stage.approval_scheduled_at && (
                                  <span className="text-[9px] text-muted-foreground">Scheduled: {new Date(stage.approval_scheduled_at).toLocaleString()}</span>
                                )}
                                {stage.approval_assigned_by_name && (
                                  <span className="text-[9px] text-muted-foreground">Assigned by: {stage.approval_assigned_by_name}</span>
                                )}
                                {!stage.approval_assignee_name && hasPermission("recruitment.approvals.manage") && (
                                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                                    onClick={() => stage.stage_record_id && handleOpenAssignApproval(stage.stage_record_id, stage.stage_name)}>
                                    Assign Approver
                                  </Button>
                                )}
                                {(() => {
                                  const isAssigned =
                                    (stage.approval_assigned_user_id && user?.id && Number(stage.approval_assigned_user_id) === Number(user.id)) ||
                                    (stage.approval_assigned_employee_id && user?.employee_id && Number(stage.approval_assigned_employee_id) === Number(user.employee_id));
                                  const canManage = hasPermission("recruitment.approvals.manage");
                                  const canAct = isAssigned || canManage;
                                  if (!canAct && stage.approval_assignee_name) {
                                    return <span className="text-[9px] text-muted-foreground">Waiting for assigned approver.</span>;
                                  }
                                  if (canAct) {
                                    return (
                                      <div className="flex flex-col gap-1 items-center">
                                        <textarea
                                          value={dynApprovalRemarks}
                                          onChange={(e) => setDynApprovalRemarks(e.target.value)}
                                          placeholder="Remarks..."
                                          className="w-28 h-10 text-[9px] border rounded px-1 py-0.5 bg-background resize-none"
                                        />

                                        <div className="flex gap-1">
                                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-green-600 border-green-300 hover:bg-green-50"
                                            onClick={() => stage.stage_record_id && setDynApprovalConfirm({ open: true, action: "APPROVE", stageRecordId: stage.stage_record_id, stageName: stage.stage_name })}
                                            disabled={dynApprovalProcessing}>
                                            Approve
                                          </Button>
                                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-red-600 border-red-300 hover:bg-red-50"
                                            onClick={() => stage.stage_record_id && setDynApprovalConfirm({ open: true, action: "REJECT", stageRecordId: stage.stage_record_id, stageName: stage.stage_name })}
                                            disabled={dynApprovalProcessing}>
                                            Reject
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </>
                            )}
                          </div>
                        )}
                        {isCurrent && !isCompleted && stage.stage_type !== "APPROVAL" && hasPermission("recruitment.applicants.manage") && workflowTimeline.instance_status === "ACTIVE" && (
                          <div className="mt-1 flex flex-col gap-1">
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                              onClick={() => {
                                setStageActionForm({ score: String(stage.score || ""), recommendation: stage.recommendation || "", comments: stage.comments || "" });
                                setStageActionDialog({ open: true, stage, stageRecord: stage.stage_record_id ? { id: stage.stage_record_id, stage_type: stage.stage_type } : null });
                              }}>
                              Complete
                            </Button>
                            {stage.allow_skip && (
                              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-amber-600"
                                onClick={async () => {
                                  if (!stage.stage_record_id) return;
                                  setStageProgression({ open: true, stageRecordId: stage.stage_record_id, action: "SKIP", skipOnly: true });
                                }}>
                                Skip
                              </Button>
                            )}
                            {stage.stage_record_id && stage.stage_type !== "CONVERT_TO_EMPLOYEE" && (
                              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                                onClick={() => handleOpenSchedule(stage)}>
                                <Calendar className="h-3 w-3 mr-1" />
                                {stage.scheduled_at || stage.status === "SCHEDULED" ? "Edit Schedule" : "Schedule"}
                              </Button>
                            )}
                          </div>
                        )}
                        {((isCurrent && stage.status === "COMPLETED") || (stage.stage_type === "APPROVAL" && (stage.approval_decision === "APPROVED" || stage.approval_decision === "REJECTED") && stage.status === "COMPLETED")) && hasPermission("recruitment.applicants.manage") && workflowTimeline.instance_status === "ACTIVE" && (
                          <div className="mt-1 flex flex-col gap-1">
                            {stage.recommendation === "FAILED" || stage.approval_decision === "REJECTED" ? (
                              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-red-600"
                                onClick={() => stage.stage_record_id && setStageProgression({ open: true, stageRecordId: stage.stage_record_id, action: "FAIL_WORKFLOW", skipOnly: false })}>
                                Fail Workflow
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-green-600"
                                onClick={() => stage.stage_record_id && setStageProgression({ open: true, stageRecordId: stage.stage_record_id, action: "MOVE_NEXT", skipOnly: false })}>
                                Move to Next
                              </Button>
                            )}
                          </div>
                        )}
                        {stage.recommendation && (
                          <span className={"text-[9px] mt-0.5 px-1 py-0.5 rounded leading-tight " + (
                            stage.recommendation === "PASSED" ? "bg-green-100 text-green-700" :
                            stage.recommendation === "FAILED" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          )}>{stage.recommendation}</span>
                        )}
                        {stage.approval_decision && (
                          <span className={"text-[9px] mt-0.5 px-1 py-0.5 rounded leading-tight " + (
                            stage.approval_decision === "APPROVED" ? "bg-green-100 text-green-700" :
                            stage.approval_decision === "REJECTED" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          )}>{stage.approval_decision}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No workflow stages configured.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        (() => {
          const { stages, statuses, recordStatuses, currentStage } = getStageInfo();
          return (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  {stages.map((stage, i) => {
                    const st = statuses[i];
                    const rs = recordStatuses[i];
                    const isCompleted = st === "completed";
                    const isCurrent = st === "current";
                    const isFailed = st === "failed";
                    const connectorColor = isCompleted ? "bg-green-500" : isCurrent ? "bg-blue-400" : isFailed ? "bg-red-400" : "bg-gray-200";
                    const showManualBadge = isCompleted && rs === "manual";
                    const showRecordedBadge = isCompleted && rs === "recorded";
                    return (
                      <div key={stage.key} className="flex items-center flex-1 min-w-0">
                        {i > 0 && (
                          <div className={"flex-1 h-0.5 mr-1 " + connectorColor} />
                        )}
                        <div className="flex flex-col items-center">
                          <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 " + (
                            isCompleted ? "bg-green-500 border-green-500 text-white" :
                            isCurrent ? "border-blue-500 bg-blue-50 text-blue-700" :
                            isFailed ? "border-red-500 bg-red-50 text-red-600" :
                            "border-gray-300 bg-gray-50 text-gray-400"
                          )}>
                            {isCompleted ? "✓" : isFailed ? "✕" : i + 1}
                          </div>
                          <span className={"text-[11px] mt-1 text-center leading-tight " + (
                            isCompleted ? "text-green-700 font-medium" :
                            isCurrent ? "text-blue-700 font-medium" :
                            isFailed ? "text-red-600 font-medium" :
                            "text-gray-400"
                          )}>
                            {stage.label}
                          </span>
                          {showRecordedBadge && (
                            <span className="text-[9px] mt-0.5 px-1 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 leading-tight">recorded</span>
                          )}
                          {showManualBadge && (
                            <span className="text-[9px] mt-0.5 px-1 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 leading-tight">manual</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center mt-4 pt-3 border-t text-sm">
                  <span className="text-muted-foreground">Current Stage:</span>{" "}
                  <span className={"font-semibold " + (currentStage === "Failed" ? "text-red-600" : "text-blue-700")}>{currentStage}</span>
                </div>
              </CardContent>
            </Card>
          );
        })()
      )}

      {!applicant.workflow_instance_id ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Interview / Stage History</CardTitle>
            {hasPermission("recruitment.interviews.manage") && (
              <Button size="sm" onClick={handleOpenScheduleInterview} className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> Schedule Interview
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <EmptyState
                message="No interviews recorded yet."
                description={getStageInfo().completedCount >= 2 ? "This applicant was moved through stages manually. No interview records were created for any interview stage." : undefined}
              />
            ) : (
              <div className="space-y-0">
                {[...interviews]
                  .sort((a, b) => {
                    const dateA = a.interview_date || a.created_at;
                    const dateB = b.interview_date || b.created_at;
                    return new Date(dateA).getTime() - new Date(dateB).getTime();
                  })
                  .map((iv, i) => {
                    const dotColor =
                      iv.status === "COMPLETED" ? "border-green-500 bg-green-50 text-green-700" :
                      iv.status === "SCHEDULED" ? "border-blue-500 bg-blue-50 text-blue-700" :
                      iv.status === "CANCELLED" ? "border-red-300 bg-red-50 text-red-600" :
                      "border-gray-300 bg-gray-50 text-gray-500";
                    const getNextStage = () => {
                      if (iv.status === "COMPLETED") {
                        switch (iv.interview_type) {
                          case "Initial Interview": return "Exam Interview";
                          case "Exam Interview": return "Final Interview";
                          case "Final Interview": return "Approval";
                          default: return "Next stage";
                        }
                      }
                      if (iv.status === "SCHEDULED") return "Pending";
                      if (iv.status === "CANCELLED") return "—";
                      return "—";
                    };
                    const recommendationBadge = (rec: string) => {
                      const map: Record<string, string> = {
                        PASSED: getStatusBadgeClass("success"),
                        FAILED: getStatusBadgeClass("danger"),
                        FOR_REVIEW: getStatusBadgeClass("warning"),
                      };
                      return <Badge className={map[rec] || getStatusBadgeClass("neutral")}>{rec}</Badge>;
                    };
                    return (
                      <div key={iv.id} className="relative pl-8 pb-6 last:pb-0">
                        {i < interviews.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className={"absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold " + dotColor}>
                          {i + 1}
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-base">{iv.interview_type || "-"}</h4>
                              {iv.recommendation && recommendationBadge(iv.recommendation)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={
                                iv.status === "COMPLETED" ? getStatusBadgeClass("success") :
                                iv.status === "SCHEDULED" ? getStatusBadgeClass("info") :
                                iv.status === "CANCELLED" ? getStatusBadgeClass("danger") :
                                getStatusBadgeClass("neutral")
                              }>{iv.status || "-"}</Badge>
                              {hasPermission("recruitment.interviews.manage") && (
                                <Button variant="ghost" size="sm" onClick={() => handleOpenEditInterview(iv)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-sm mb-3">
                            <div><span className="text-muted-foreground">Score:</span> {iv.rating ?? "-"}</div>
                            <div><span className="text-muted-foreground">Assigned To:</span> {iv.interviewer_name || iv.interviewer || "Not assigned yet"}</div>
                            <div><span className="text-muted-foreground">Date:</span> {iv.interview_date ? formatDateShort(iv.interview_date) : "-"}</div>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">HR Notes / Comments:</span>
                            <p className="mt-0.5 whitespace-pre-wrap">{iv.notes || "-"}</p>
                          </div>
                          <div className="text-sm mt-2 pt-2 border-t">
                            <span className="text-muted-foreground">Next Stage:</span>
                            <p className={"mt-0.5 font-medium " + (
                              iv.status === "COMPLETED" ? "text-green-700" :
                              iv.status === "SCHEDULED" ? "text-blue-700" :
                              iv.status === "CANCELLED" ? "text-red-600" :
                              "text-muted-foreground"
                            )}>{getNextStage()}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Workflow Stage History</CardTitle>
            {workflowTimeline && (hasPermission("recruitment.applicants.manage") || hasPermission("recruitment.interviews.manage")) && (
              <Button size="sm" onClick={handleOpenScheduleInterview} className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> Schedule Workflow Stage
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!workflowTimeline || !workflowTimeline.stages || workflowTimeline.stages.filter((s: any) => s.stage_type !== "APPROVAL").length === 0 ? (
              <EmptyState message="No workflow stages recorded yet." />
            ) : (
              <div className="space-y-0">
                {workflowTimeline.stages
                  .filter((s: any) => s.stage_type !== "APPROVAL")
                  .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                  .map((stage: any, i: number) => {
                    const dotColor =
                      stage.status === "COMPLETED" ? "border-green-500 bg-green-50 text-green-700" :
                      stage.is_current && stage.status !== "COMPLETED" ? "border-blue-500 bg-blue-50 text-blue-700" :
                      stage.status === "FAILED" || stage.status === "CANCELLED" ? "border-red-300 bg-red-50 text-red-600" :
                      stage.status === "SCHEDULED" ? "border-blue-500 bg-blue-50 text-blue-700" :
                      "border-gray-300 bg-gray-50 text-gray-500";
                    return (
                      <div key={stage.stage_record_id || stage.workflow_stage_id} className="relative pl-8 pb-6 last:pb-0">
                        {i < workflowTimeline.stages.filter((s: any) => s.stage_type !== "APPROVAL").length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className={"absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold " + dotColor}>
                          {i + 1}
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-base">{stage.stage_name || "-"}</h4>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{stage.stage_type}</span>
                              {stage.recommendation && (
                                <Badge className={
                                  stage.recommendation === "PASSED" ? getStatusBadgeClass("success") :
                                  stage.recommendation === "FAILED" ? getStatusBadgeClass("danger") :
                                  stage.recommendation === "FOR_REVIEW" ? getStatusBadgeClass("warning") :
                                  ""
                                }>{stage.recommendation}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={
                                stage.status === "COMPLETED" ? getStatusBadgeClass("success") :
                                stage.is_current && stage.status !== "COMPLETED" && stage.status !== "FAILED" ? getStatusBadgeClass("info") :
                                stage.status === "FAILED" ? getStatusBadgeClass("danger") :
                                stage.status === "CANCELLED" ? getStatusBadgeClass("danger") :
                                stage.status === "SCHEDULED" ? getStatusBadgeClass("info") :
                                getStatusBadgeClass("neutral")
                              }>{stage.status || "-"}</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-sm mb-3">
                            <div><span className="text-muted-foreground">Score:</span> {stage.score ?? "-"}</div>
                            <div><span className="text-muted-foreground">Assigned To:</span> {stage.assigned_name || "Not assigned yet"}</div>
                            <div><span className="text-muted-foreground">Scheduled:</span> {stage.scheduled_at ? formatDateShort(stage.scheduled_at) : "-"}</div>
                            {stage.completed_at && <div><span className="text-muted-foreground">Completed:</span> {formatDateShort(stage.completed_at)}</div>}
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Comments:</span>
                            <p className="mt-0.5 whitespace-pre-wrap">{stage.comments || "-"}</p>
                          </div>
                          {hasPermission("recruitment.applicants.manage") && stage.stage_record_id && stage.status !== "COMPLETED" && stage.status !== "FAILED" && stage.status !== "CANCELLED" && stage.stage_type !== "CONVERT_TO_EMPLOYEE" && (
                            <div className="mt-3 pt-3 border-t flex gap-2">
                              <Button size="sm" variant="outline" className="h-7 text-[11px]"
                                onClick={() => handleOpenSchedule(stage)}>
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                {stage.scheduled_at || stage.status === "SCHEDULED" ? "Edit Schedule" : "Schedule"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Requirements</CardTitle>
          <Button size="sm" onClick={handleOpenAddReq} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Requirement
          </Button>
        </CardHeader>
        <CardContent>
            {requirements.length === 0 ? (
            <EmptyState message="No requirements added yet." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Requirement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.requirement_name}</TableCell>
                      <TableCell>{reqStatusBadge(r.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.remarks || "-"}</TableCell>
                      <TableCell className="text-sm">{r.verified_date ? formatDateShort(r.verified_date) : "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => handleOpenEditReq(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Delete" onClick={() => handleDeleteReq(r.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleReqStatus(r, "Pending")}>Pending</Button>
                          <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleReqStatus(r, "Completed")}>Complete</Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleReqStatus(r, "Rejected")}>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAMILY MEMBERS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setFamilyOpen(!familyOpen)}>
          <CardTitle>Family Members</CardTitle>
          <span className="text-xs text-muted-foreground">{familyOpen ? '▲' : '▼'}</span>
        </CardHeader>
        {familyOpen && (
          <CardContent>
            {familyData.length === 0 ? (
              <EmptyState message="No family members recorded." />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>Name</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Occupation</TableHead>
                      <TableHead>Contact</TableHead>
                      {hasPermission("recruitment.applicants.manage") && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {familyData.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.full_name}</TableCell>
                        <TableCell className="capitalize">{m.relationship_type}</TableCell>
                        <TableCell>{m.occupation || '—'}</TableCell>
                        <TableCell>{m.contact_number || '—'}</TableCell>
                        {hasPermission("recruitment.applicants.manage") && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingFamily({ ...m, birthdate: m.birthdate?.split('T')[0] || '' }); setFamilyDialog({ open: true, mode: "edit", item: m }); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteFamily(m.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {hasPermission("recruitment.applicants.manage") && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => { setEditingFamily({ relationship_type: "spouse", is_dependent: false }); setFamilyDialog({ open: true, mode: "create", item: null }); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Family Member
              </Button>
            )}
            <Dialog open={familyDialog.open} onOpenChange={(open) => { if (!open) setFamilyDialog({ open: false, mode: "create", item: null }); }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{familyDialog.mode === "create" ? "Add Family Member" : "Edit Family Member"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Full Name <span className="text-red-500">*</span></Label>
                    <Input value={editingFamily.full_name || ""} onChange={e => setEditingFamily({ ...editingFamily, full_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Relationship <span className="text-red-500">*</span></Label>
                    <Select value={editingFamily.relationship_type || ""} onValueChange={(v) => setEditingFamily({ ...editingFamily, relationship_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="dependent">Dependent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Birthdate</Label>
                    <Input type="date" value={editingFamily.birthdate || ""} onChange={e => setEditingFamily({ ...editingFamily, birthdate: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Occupation</Label>
                    <Input value={editingFamily.occupation || ""} onChange={e => setEditingFamily({ ...editingFamily, occupation: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Contact Number</Label>
                    <Input value={editingFamily.contact_number || ""} onChange={e => setEditingFamily({ ...editingFamily, contact_number: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Address</Label>
                    <Input value={editingFamily.address || ""} onChange={e => setEditingFamily({ ...editingFamily, address: e.target.value })} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editingFamily.is_dependent || false} onChange={e => setEditingFamily({ ...editingFamily, is_dependent: e.target.checked })} className="accent-primary" />
                    Is Dependent
                  </label>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setFamilyDialog({ open: false, mode: "create", item: null })}>Cancel</Button>
                  <Button onClick={familyDialog.mode === "create" ? handleCreateFamily : handleUpdateFamily}>{familyDialog.mode === "create" ? "Add" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        )}
      </Card>

      {/* EDUCATION */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setEducationOpen(!educationOpen)}>
          <CardTitle>Education</CardTitle>
          <span className="text-xs text-muted-foreground">{educationOpen ? '▲' : '▼'}</span>
        </CardHeader>
        {educationOpen && (
          <CardContent>
            {educationData.length === 0 ? (
              <EmptyState message="No education records." />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>School</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Year</TableHead>
                      {hasPermission("recruitment.applicants.manage") && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {educationData.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.school_name}</TableCell>
                        <TableCell className="capitalize">{e.education_level.replace('_', ' ')}</TableCell>
                        <TableCell>{e.course_or_degree || '—'}</TableCell>
                        <TableCell>{e.year_started || '—'}{e.year_graduated ? ` - ${e.year_graduated}` : ''}</TableCell>
                        {hasPermission("recruitment.applicants.manage") && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingEducation({ ...e }); setEducationDialog({ open: true, mode: "edit", item: e }); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteEducation(e.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {hasPermission("recruitment.applicants.manage") && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => { setEditingEducation({ education_level: "college" }); setEducationDialog({ open: true, mode: "create", item: null }); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Education
              </Button>
            )}
            <Dialog open={educationDialog.open} onOpenChange={(open) => { if (!open) setEducationDialog({ open: false, mode: "create", item: null }); }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{educationDialog.mode === "create" ? "Add Education" : "Edit Education"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Education Level <span className="text-red-500">*</span></Label>
                    <Select value={editingEducation.education_level || ""} onValueChange={(v) => setEditingEducation({ ...editingEducation, education_level: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elementary">Elementary</SelectItem>
                        <SelectItem value="high_school">High School</SelectItem>
                        <SelectItem value="college">College</SelectItem>
                        <SelectItem value="masters">Masters</SelectItem>
                        <SelectItem value="doctorate">Doctorate</SelectItem>
                        <SelectItem value="vocational">Vocational</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>School Name <span className="text-red-500">*</span></Label>
                    <Input value={editingEducation.school_name || ""} onChange={e => setEditingEducation({ ...editingEducation, school_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Course / Degree</Label>
                    <Input value={editingEducation.course_or_degree || ""} onChange={e => setEditingEducation({ ...editingEducation, course_or_degree: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Year Started</Label>
                    <Input type="number" value={editingEducation.year_started || ""} onChange={e => setEditingEducation({ ...editingEducation, year_started: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Year Graduated</Label>
                    <Input type="number" value={editingEducation.year_graduated || ""} onChange={e => setEditingEducation({ ...editingEducation, year_graduated: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Honors / Awards</Label>
                    <Textarea value={editingEducation.honors_awards || ""} onChange={e => setEditingEducation({ ...editingEducation, honors_awards: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEducationDialog({ open: false, mode: "create", item: null })}>Cancel</Button>
                  <Button onClick={educationDialog.mode === "create" ? handleCreateEducation : handleUpdateEducation}>{educationDialog.mode === "create" ? "Add" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        )}
      </Card>

      {/* WORK EXPERIENCE */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setExperienceOpen(!experienceOpen)}>
          <CardTitle>Work Experience</CardTitle>
          <span className="text-xs text-muted-foreground">{experienceOpen ? '▲' : '▼'}</span>
        </CardHeader>
        {experienceOpen && (
          <CardContent>
            {experienceData.length === 0 ? (
              <EmptyState message="No work experience recorded." />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>Company</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Reason for Leaving</TableHead>
                      {hasPermission("recruitment.applicants.manage") && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {experienceData.map((x: any) => (
                      <TableRow key={x.id}>
                        <TableCell className="font-medium">{x.company_name}</TableCell>
                        <TableCell>{x.position}</TableCell>
                        <TableCell>{x.start_date?.split('T')[0] || '—'} to {x.end_date?.split('T')[0] || 'Present'}</TableCell>
                        <TableCell>{x.reason_for_leaving || '—'}</TableCell>
                        {hasPermission("recruitment.applicants.manage") && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingExperience({ ...x, start_date: x.start_date?.split('T')[0] || '', end_date: x.end_date?.split('T')[0] || '' }); setExperienceDialog({ open: true, mode: "edit", item: x }); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteExperience(x.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {hasPermission("recruitment.applicants.manage") && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => { setEditingExperience({}); setExperienceDialog({ open: true, mode: "create", item: null }); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Work Experience
              </Button>
            )}
            <Dialog open={experienceDialog.open} onOpenChange={(open) => { if (!open) setExperienceDialog({ open: false, mode: "create", item: null }); }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{experienceDialog.mode === "create" ? "Add Work Experience" : "Edit Work Experience"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Company Name <span className="text-red-500">*</span></Label>
                    <Input value={editingExperience.company_name || ""} onChange={e => setEditingExperience({ ...editingExperience, company_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Position <span className="text-red-500">*</span></Label>
                    <Input value={editingExperience.position || ""} onChange={e => setEditingExperience({ ...editingExperience, position: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Start Date</Label>
                    <Input type="date" value={editingExperience.start_date || ""} onChange={e => setEditingExperience({ ...editingExperience, start_date: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>End Date</Label>
                    <Input type="date" value={editingExperience.end_date || ""} onChange={e => setEditingExperience({ ...editingExperience, end_date: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Reason for Leaving</Label>
                    <Textarea value={editingExperience.reason_for_leaving || ""} onChange={e => setEditingExperience({ ...editingExperience, reason_for_leaving: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setExperienceDialog({ open: false, mode: "create", item: null })}>Cancel</Button>
                  <Button onClick={experienceDialog.mode === "create" ? handleCreateExperience : handleUpdateExperience}>{experienceDialog.mode === "create" ? "Add" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        )}
      </Card>



      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Applicant</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Initial">Initial</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Final Interview">Final Interview</SelectItem>
                  <SelectItem value="Exam Interview">Exam Interview</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Fail">Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Rating</Label>
              <Input name="rating" value={editForm.rating} onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })} placeholder="0-10" />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea name="notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveDetails} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reqDialog} onOpenChange={setReqDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingReq ? "Edit Requirement" : "Add Requirement"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Requirement Name <span className="text-red-500">*</span></Label>
              <Input
                value={reqForm.requirement_name}
                onChange={(e) => setReqForm({ ...reqForm, requirement_name: e.target.value })}
                placeholder="e.g., Diploma, NBI Clearance, Medical"
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={reqForm.status} onValueChange={(v) => setReqForm({ ...reqForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Remarks</Label>
              <Textarea
                value={reqForm.remarks}
                onChange={(e) => setReqForm({ ...reqForm, remarks: e.target.value })}
                placeholder="Optional remarks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReqDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveReq} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingReq ? "Save Changes" : "Add Requirement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={convertDialog} onOpenChange={setConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Convert to Employee</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            This will create an employee record for {applicant.first_name} {applicant.last_name}.
          </p>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border text-sm space-y-1">
              <p><span className="text-muted-foreground">Employment Status:</span> <strong>PROBATIONARY</strong></p>
              <p className="text-xs text-muted-foreground">
                All applicants are hired as Probationary by default.
              </p>
            </div>

            <div className="space-y-1">
              <Label>Branch</Label>
              <Select value={convertForm.branch_id} onValueChange={(v) => setConvertForm({ ...convertForm, branch_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b: { id: number; name: string; code: string }) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name} ({b.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Hired Date</Label>
              <Input type="date" value={convertForm.hired_date} onChange={(e) => setConvertForm({ ...convertForm, hired_date: e.target.value })} />
            </div>

            <div className="space-y-1">
              <Label>Probation Period (Months)</Label>
              <Input
                type="number"
                value={convertForm.probation_period_months}
                onChange={(e) => setConvertForm({ ...convertForm, probation_period_months: e.target.value })}
                min={1}
                max={24}
                placeholder="Company Default (6 months)"
              />
              <p className="text-xs text-muted-foreground">Leave blank to use company default (6 months)</p>
            </div>

            <div className="space-y-1">
              <Label>Employee Code <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                value={convertForm.employee_code}
                onChange={(e) => setConvertForm({ ...convertForm, employee_code: e.target.value })}
                placeholder="Leave blank to auto-generate"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated if left blank and auto-generation is enabled.
              </p>
            </div>

            {convertForm.hired_date && (
              <div className="p-3 bg-muted/30 rounded border text-sm">
                <p className="text-xs text-muted-foreground mb-1">Expected Regularization Date</p>
                <p className="font-medium">
                  {(() => {
                    const hireDate = new Date(convertForm.hired_date);
                    const months = convertForm.probation_period_months
                      ? Number(convertForm.probation_period_months)
                      : 6;
                    hireDate.setMonth(hireDate.getMonth() + months);
                    return hireDate.toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    });
                  })()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {convertForm.probation_period_months || "6"} month{convertForm.probation_period_months !== "1" ? "s" : ""} probation period
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialog(false)}>Cancel</Button>
            <Button onClick={handleConvert} disabled={converting}>
              {converting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Convert & Hire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={interviewDialog.open} onOpenChange={(open) => !open && setInterviewDialog({ open: false, mode: "create", item: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{interviewDialog.mode === "create" ? (applicant.workflow_instance_id ? "Schedule Workflow Stage" : "Schedule Interview") : "Edit Interview"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {applicant.workflow_instance_id ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Workflow Stage <span className="text-red-500">*</span></p>
                  <select value={interviewForm.workflow_stage_id || ""} onChange={(e) => setInterviewForm({ ...interviewForm, workflow_stage_id: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                    <option value="">Select stage</option>
                    {workflowTimeline?.stages
                      ?.filter((s: any) => s.stage_type !== "APPROVAL" && (!s.stage_record_id || s.is_current || s.status === "PENDING" || s.status === "SCHEDULED"))
                      .map((s: any) => (
                        <option key={s.workflow_stage_id} value={s.workflow_stage_id}>{s.stage_name} ({s.stage_type})</option>
                      ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assigned User</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => {
                      setUserPickerTarget("interview");
                      setUserPickerTitle("Select Assigned User");
                      setUserPickerOpen(true);
                    }}
                  >
                    {interviewForm.interviewer_user_id
                      ? (interviewUserData
                          ? `${interviewUserData.name} (${interviewUserData.employee_code})`
                          : `User #${interviewForm.interviewer_user_id}`)
                      : "Not assigned"}
                  </Button>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Scheduled Date/Time <span className="text-red-500">*</span></p>
                  <input type="datetime-local" value={interviewForm.interview_date} onChange={(e) => setInterviewForm({ ...interviewForm, interview_date: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <select value={interviewForm.status} onChange={(e) => setInterviewForm({ ...interviewForm, status: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Comments</p>
                  <textarea value={interviewForm.notes} onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })} className="w-full border rounded px-2 py-1 bg-background min-h-[80px]" placeholder="Stage comments / notes" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Interview Type <span className="text-red-500">*</span></p>
                  <select value={interviewForm.interview_type} onChange={(e) => setInterviewForm({ ...interviewForm, interview_type: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                    <option value="Initial Interview">Initial Interview</option>
                    <option value="Exam Interview">Exam Interview</option>
                    <option value="Final Interview">Final Interview</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assigned Interviewer</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => {
                      setUserPickerTarget("interview");
                      setUserPickerTitle("Select Interviewer");
                      setUserPickerOpen(true);
                    }}
                  >
                    {interviewForm.interviewer_user_id
                      ? (interviewUserData
                          ? `${interviewUserData.name} (${interviewUserData.employee_code})`
                          : `User #${interviewForm.interviewer_user_id}`)
                      : "Not assigned"}
                  </Button>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Interview Date/Time <span className="text-red-500">*</span></p>
                  <input type="datetime-local" value={interviewForm.interview_date} onChange={(e) => setInterviewForm({ ...interviewForm, interview_date: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <select value={interviewForm.status} onChange={(e) => setInterviewForm({ ...interviewForm, status: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="RESCHEDULED">RESCHEDULED</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Score / Rating (0 – 10)</p>
                  <input type="number" min="0" max="10" step="0.5" value={interviewForm.rating} onChange={(e) => setInterviewForm({ ...interviewForm, rating: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" placeholder="Leave blank if not yet scored" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
                  <select value={interviewForm.recommendation} onChange={(e) => setInterviewForm({ ...interviewForm, recommendation: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                    <option value="">None</option>
                    <option value="PASSED">PASSED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="FOR_REVIEW">FOR REVIEW</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <textarea value={interviewForm.notes} onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })} className="w-full border rounded px-2 py-1 bg-background min-h-[80px]" placeholder="Interview notes / comments" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterviewDialog({ open: false, mode: "create", item: null })}>Cancel</Button>
            <Button onClick={handleSaveInterview} disabled={savingInterview}>
              {savingInterview && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {interviewDialog.mode === "create" ? "Schedule" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stageConfirm.open} onOpenChange={(open) => !open && handleCancelStageUpdate()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Applicant Stage?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {stageConfirm.suggestedStage === "Fail"
              ? "Interview failed. Mark applicant as Fail?"
              : `${stageConfirm.interviewType} passed. Move applicant to ${stageConfirm.suggestedStage}?`}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleCancelStageUpdate}>
              Keep Current Stage
            </Button>
            <Button onClick={handleConfirmStageUpdate}>
              Yes, {stageConfirm.suggestedStage === "Fail" ? "Mark as Fail" : `Move to ${stageConfirm.suggestedStage}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={stageActionDialog.open} onOpenChange={(open) => !open && setStageActionDialog({ open: false, stage: null, stageRecord: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Complete Stage: {stageActionDialog.stage?.stage_name || ""}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Stage Type: {stageActionDialog.stage?.stage_type || "-"}</p>
            {(stageActionDialog.stage?.requires_score || stageActionDialog.stage?.stage_type === "INTERVIEW" || stageActionDialog.stage?.stage_type === "EXAM") && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Score {stageActionDialog.stage?.passing_score ? `(Passing: ${stageActionDialog.stage.passing_score})` : ""}</p>
                <input type="number" min="0" max="100" step="0.5" value={stageActionForm.score} onChange={(e) => setStageActionForm({ ...stageActionForm, score: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" />
              </div>
            )}
            {stageActionDialog.stage?.stage_type === "APPROVAL" ? (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Decision <span className="text-red-500">*</span></p>
                <select value={stageActionForm.recommendation} onChange={(e) => setStageActionForm({ ...stageActionForm, recommendation: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                  <option value="">Select...</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
                <select value={stageActionForm.recommendation} onChange={(e) => setStageActionForm({ ...stageActionForm, recommendation: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                  <option value="">None</option>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="FOR_REVIEW">FOR REVIEW</option>
                </select>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Comments</p>
              <textarea value={stageActionForm.comments} onChange={(e) => setStageActionForm({ ...stageActionForm, comments: e.target.value })} className="w-full border rounded px-2 py-1 bg-background min-h-[80px]" placeholder="Optional comments" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageActionDialog({ open: false, stage: null, stageRecord: null })}>Cancel</Button>
            <Button onClick={handleStageActionComplete} disabled={stageActionProcessing}>
              {stageActionProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stageProgression.open} onOpenChange={(open) => !open && setStageProgression({ open: false, stageRecordId: null, action: null, skipOnly: false })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{stageProgression.action === "MOVE_NEXT" ? "Move to Next Stage" : stageProgression.action === "FAIL_WORKFLOW" ? "Fail Workflow" : "Skip Stage"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {stageProgression.action === "MOVE_NEXT" && "This stage has been completed. Move the applicant to the next stage?"}
            {stageProgression.action === "FAIL_WORKFLOW" && "This action will mark the workflow as failed. The applicant will be marked as Fail."}
            {stageProgression.action === "SKIP" && "Skip this stage and move to the next?"}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setStageProgression({ open: false, stageRecordId: null, action: null, skipOnly: false })}>
              Cancel
            </Button>
            <Button onClick={handleStageProgression} disabled={progressionProcessing} className={
              stageProgression.action === "FAIL_WORKFLOW" ? "bg-red-600 hover:bg-red-700" :
              stageProgression.action === "SKIP" ? "bg-amber-600 hover:bg-amber-700" :
              "bg-blue-600 hover:bg-blue-700"
            }>
              {progressionProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {stageProgression.action === "MOVE_NEXT" ? "Move Next" : stageProgression.action === "FAIL_WORKFLOW" ? "Fail Workflow" : "Skip Stage"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dynApprovalConfirm.open} onOpenChange={(open) => !open && setDynApprovalConfirm({ open: false, action: "APPROVE", stageRecordId: null, stageName: "" })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{dynApprovalConfirm.action === "APPROVE" ? "Approve Stage" : "Reject Stage"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {dynApprovalConfirm.action === "APPROVE"
              ? `Confirm approval of "${dynApprovalConfirm.stageName}"?`
              : `Confirm rejection of "${dynApprovalConfirm.stageName}"?`}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDynApprovalConfirm({ open: false, action: "APPROVE", stageRecordId: null, stageName: "" })}>
              Cancel
            </Button>
            <Button onClick={handleDynApprovalConfirm} disabled={dynApprovalProcessing} className={
              dynApprovalConfirm.action === "APPROVE" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            }>
              {dynApprovalProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dynApprovalConfirm.action === "APPROVE" ? "Yes, Approve" : "Yes, Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assignApprovalDialog.open} onOpenChange={(open) => !open && setAssignApprovalDialog({ open: false, stageRecordId: null, stageName: "" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Approver: {assignApprovalDialog.stageName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Approver <span className="text-red-500">*</span></p>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => {
                  setUserPickerTarget("approval");
                  setUserPickerTitle("Select Approver");
                  setUserPickerOpen(true);
                }}
              >
                {assignApprovalForm.assigned_user_id
                  ? (approvalUserData
                      ? `${approvalUserData.name} (${approvalUserData.employee_code})`
                      : `User #${assignApprovalForm.assigned_user_id}`)
                  : "Select approver..."}
              </Button>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Scheduled Date/Time</p>
              <input type="datetime-local" value={assignApprovalForm.scheduled_at} onChange={(e) => setAssignApprovalForm({ ...assignApprovalForm, scheduled_at: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assignment Notes</p>
              <textarea value={assignApprovalForm.comments} onChange={(e) => setAssignApprovalForm({ ...assignApprovalForm, comments: e.target.value })} className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" placeholder="Optional notes for the approver" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignApprovalDialog({ open: false, stageRecordId: null, stageName: "" })}>Cancel</Button>
            <Button onClick={handleAssignApproval} disabled={assignApprovalProcessing}>
              {assignApprovalProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign Approver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialog.open} onOpenChange={(open) => !open && setScheduleDialog({ open: false, stageRecordId: null, stageName: "", stage_type: "", applicant_id: 0, assigned_user_id: "none", assigned_employee_id: "", scheduled_at: "", comments: "" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{scheduleDialog.scheduled_at ? "Reschedule" : "Schedule"} {scheduleDialog.stageName}</DialogTitle>
            <DialogDescription>
              Update schedule and assignment for this workflow stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Assigned User</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => {
                  setUserPickerTarget("schedule");
                  setUserPickerTitle("Select Assigned User");
                  setUserPickerOpen(true);
                }}
              >
                {scheduleDialog.assigned_user_id && scheduleDialog.assigned_user_id !== "none"
                  ? (scheduleUserData
                      ? `${scheduleUserData.name} (${scheduleUserData.employee_code})`
                      : `User #${scheduleDialog.assigned_user_id}`)
                  : "Not assigned"}
              </Button>
            </div>
            <div className="space-y-1">
              <Label>Scheduled Date/Time</Label>
              <Input type="datetime-local" value={scheduleDialog.scheduled_at} onChange={(e) => setScheduleDialog({ ...scheduleDialog, scheduled_at: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Comments / Notes</Label>
              <Textarea value={scheduleDialog.comments} onChange={(e) => setScheduleDialog({ ...scheduleDialog, comments: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialog({ open: false, stageRecordId: null, stageName: "", stage_type: "", applicant_id: 0, assigned_user_id: "none", assigned_employee_id: "", scheduled_at: "", comments: "" })} disabled={scheduleProcessing}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule} disabled={scheduleProcessing}>
              {scheduleProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adminCorrectionDialog.open} onOpenChange={(open) => !open && setAdminCorrectionDialog({ open: false, correctionType: null, targetStageId: "", stageRecordId: "", status: "", score: "", recommendation: "", reason: "" })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Admin Workflow Correction</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Correction Type <span className="text-red-500">*</span></p>
              <select value={adminCorrectionDialog.correctionType || ""} onChange={(e) => setAdminCorrectionDialog({ ...adminCorrectionDialog, correctionType: e.target.value as any })} className="w-full border rounded px-2 py-1 bg-background">
                <option value="">Select correction type...</option>
                <option value="ROLLBACK">Rollback to Stage</option>
                <option value="CORRECT_RESULT">Correct Stage Result</option>
                <option value="FAIL">Mark Applicant Failed</option>
              </select>
            </div>

            {adminCorrectionDialog.correctionType === "ROLLBACK" && workflowTimeline?.stages && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Target Stage <span className="text-red-500">*</span></p>
                <select value={adminCorrectionDialog.targetStageId} onChange={(e) => setAdminCorrectionDialog({ ...adminCorrectionDialog, targetStageId: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                  <option value="">Select target stage...</option>
                  {workflowTimeline.stages.map((s: any) => (
                    <option key={s.workflow_stage_id} value={s.workflow_stage_id}>
                      {s.stage_name} {s.is_current ? "(current)" : s.status === "COMPLETED" ? "(completed)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Rolls applicant back to the selected stage. Current stage is deactivated.</p>
              </div>
            )}

            {adminCorrectionDialog.correctionType === "CORRECT_RESULT" && workflowTimeline?.stages && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stage Record <span className="text-red-500">*</span></p>
                  <select value={adminCorrectionDialog.stageRecordId} onChange={(e) => {
                    const stage = workflowTimeline.stages.find((s: any) => s.stage_record_id === Number(e.target.value));
                    setAdminCorrectionDialog({ ...adminCorrectionDialog, stageRecordId: e.target.value, status: stage?.status || "", score: String(stage?.score || ""), recommendation: stage?.recommendation || "" });
                  }} className="w-full border rounded px-2 py-1 bg-background">
                    <option value="">Select stage record...</option>
                    {workflowTimeline.stages.filter((s: any) => s.stage_record_id).map((s: any) => (
                      <option key={s.stage_record_id} value={s.stage_record_id}>
                        {s.stage_name} ({s.status}){s.recommendation ? ` - ${s.recommendation}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {adminCorrectionDialog.stageRecordId && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <select value={adminCorrectionDialog.status} onChange={(e) => setAdminCorrectionDialog({ ...adminCorrectionDialog, status: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                        <option value="">Keep</option>
                        <option value="PENDING">PENDING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="FAILED">FAILED</option>
                        <option value="SKIPPED">SKIPPED</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Score</p>
                      <input type="number" min="0" max="100" step="0.5" value={adminCorrectionDialog.score} onChange={(e) => setAdminCorrectionDialog({ ...adminCorrectionDialog, score: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" placeholder="Keep" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
                      <select value={adminCorrectionDialog.recommendation} onChange={(e) => setAdminCorrectionDialog({ ...adminCorrectionDialog, recommendation: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                        <option value="">Keep</option>
                        <option value="PASSED">PASSED</option>
                        <option value="FAILED">FAILED</option>
                        <option value="FOR_REVIEW">FOR_REVIEW</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            {adminCorrectionDialog.correctionType === "FAIL" && (
              <p className="text-sm text-muted-foreground">This will mark the workflow as <strong>FAILED</strong> and set applicant status to <strong>Fail</strong>.</p>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-1">Correction Reason <span className="text-red-500">*</span></p>
              <textarea value={adminCorrectionDialog.reason} onChange={(e) => setAdminCorrectionDialog({ ...adminCorrectionDialog, reason: e.target.value })} className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" placeholder="Explain why this correction is needed..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminCorrectionDialog({ open: false, correctionType: null, targetStageId: "", stageRecordId: "", status: "", score: "", recommendation: "", reason: "" })}>Cancel</Button>
            <Button onClick={handleAdminCorrection} disabled={adminCorrectionProcessing || !adminCorrectionDialog.correctionType || !adminCorrectionDialog.reason.trim()}>
              {adminCorrectionProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Apply Correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserPickerDialog
        open={userPickerOpen}
        onOpenChange={setUserPickerOpen}
        title={userPickerTitle}
        includeNotAssigned={userPickerTarget !== "approval"}
        onSelect={(user) => {
          if (userPickerTarget === "interview") {
            setInterviewUserData(user);
            setInterviewForm({
              ...interviewForm,
              interviewer_user_id: user ? String(user.user_id) : "",
            });
          } else if (userPickerTarget === "schedule") {
            setScheduleUserData(user);
            setScheduleDialog({
              ...scheduleDialog,
              assigned_user_id: user ? String(user.user_id) : "none",
            });
          } else if (userPickerTarget === "approval") {
            setApprovalUserData(user);
            setAssignApprovalForm({
              ...assignApprovalForm,
              assigned_user_id: user ? String(user.user_id) : "",
            });
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => { if (!open) setDeleteConfirm({ open: false, title: "", message: "", onConfirm: () => {} }); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{deleteConfirm.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm.onConfirm()}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApplicantDetailPage;
