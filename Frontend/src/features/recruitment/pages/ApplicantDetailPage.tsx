import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getApplicantById,
  updateApplicant,
  convertApplicantToEmployee,
} from "@/services/applicantService";
import { getApplicantInterviews } from "@/services/applicantInterviewService";
import { getApplicantApprovals } from "@/services/applicantApprovalService";
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
import { getActiveBranches } from "@/services/branchService";
import { formatDateShort } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import {
  ArrowLeft, Loader2, UserPlus, Plus, Pencil, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";

interface Applicant {
  id: number; job_position_id: number | null; first_name: string; middle_name: string | null;
  last_name: string; suffix: string | null; email: string | null; phone: string | null;
  address: string | null; resume_url: string | null; status: string; rating: string | null;
  source: string | null; notes: string | null; applied_date: string;
  job_title: string | null; job_department: string | null; employee_id: number | null;
}

interface Requirement {
  id: number; applicant_id: number; requirement_name: string;
  status: string; remarks: string | null; verified_date: string | null;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Initial: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Pending: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    "Final Interview": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    "Exam Interview": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Fail: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return <Badge className={map[status] || ""}>{status}</Badge>;
};

const reqStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    Pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return <Badge className={map[status] || ""}>{status}</Badge>;
};

const ApplicantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [branches, setBranches] = useState<{ id: number; code: string; name: string }[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ status: "", rating: "", notes: "" });

  const [convertDialog, setConvertDialog] = useState(false);
  const [convertForm, setConvertForm] = useState({
    branch_id: "",
    hired_date: new Date().toISOString().split("T")[0],
    probation_period_months: "",
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
  const [approvals, setApprovals] = useState<any[]>([]);

  const getStageInfo = () => {
    const stages = [
      { key: "applied", label: "Applied" },
      { key: "initial", label: "Initial Interview" },
      { key: "exam", label: "Exam Interview" },
      { key: "final", label: "Final Interview" },
      { key: "approval", label: "Approval" },
      { key: "converted", label: "Employee" },
    ];

    const status = (applicant.status || "").toUpperCase();
    const isFailed = ["REJECTED", "WITHDRAWN", "FAIL"].some(s => status.includes(s));
    const isHired = status === "HIRED" || !!applicant.employee_id;

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
    for (let i = 0; i < stages.length; i++) {
      if (i < currentIdx) {
        statuses.push("completed");
      } else if (i === currentIdx) {
        statuses.push(isFailed ? "failed" : "current");
      } else {
        statuses.push("future");
      }
    }

    const currentStage = isFailed ? "Failed" : stages[currentIdx].label;
    const completedCount = isFailed ? currentIdx : currentIdx + 1;

    return { stages, statuses, currentStage, completedCount, total: stages.length };
  };

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [app, reqs, brs, ivs, apps] = await Promise.all([
        getApplicantById(Number(id)),
        getApplicantRequirements(Number(id)).catch(() => []),
        getActiveBranches().catch(() => []),
        getApplicantInterviews(Number(id)).catch(() => []),
        getApplicantApprovals(Number(id)).catch(() => []),
      ]);
      setApplicant(app);
      setRequirements(reqs);
      setBranches(brs);
      setInterviews(ivs);
      setApprovals(apps);
      setEditForm({ status: app.status, rating: app.rating || "", notes: app.notes || "" });
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
    if (!confirm("Delete this family member?")) return;
    try {
      await deleteApplicantFamily(Number(id), memberId);
      toast.success("Family member deleted");
      loadFamily();
    } catch (err: any) { toast.error(err.message); }
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
    if (!confirm("Delete this education record?")) return;
    try {
      await deleteApplicantEducation(Number(id), eduId);
      toast.success("Education record deleted");
      loadEducation();
    } catch (err: any) { toast.error(err.message); }
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
    if (!confirm("Delete this work experience?")) return;
    try {
      await deleteApplicantExperience(Number(id), expId);
      toast.success("Work experience deleted");
      loadExperience();
    } catch (err: any) { toast.error(err.message); }
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
    if (!confirm("Delete this requirement?")) return;
    try {
      await deleteApplicantRequirement(Number(id), reqId);
      toast.success("Requirement deleted");
      fetchRequirements();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
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
      } else if (message.includes("requirements")) {
        toast.error(message);
      } else {
        toast.error("Unable to convert applicant. Please try again.");
      }
      fetchAll();
    } finally {
      setConverting(false);
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
          {applicant.employee_id && (
            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
              <UserPlus className="h-3 w-3" /> Converted to Employee
            </Badge>
          )}
          {isAdmin && applicant.status === "Completed" && !applicant.employee_id && (
            <Button size="sm" onClick={handleConvertClick} className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" /> Convert to Employee
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setEditDialog(true)}>Edit</Button>
        </div>
      </div>

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
            <p><span className="text-muted-foreground">Current Recruitment Stage:</span>{" "}
              <span className={"font-semibold " + (getStageInfo().currentStage === "Failed" ? "text-red-600" : "text-blue-700")}>{getStageInfo().currentStage}</span>
            </p>
            <p><span className="text-muted-foreground">Progress:</span> {getStageInfo().completedCount} / {getStageInfo().total} Stages Completed</p>
            {applicant.notes && <p><span className="text-muted-foreground">Notes:</span> {applicant.notes}</p>}
          </CardContent>
        </Card>
      </div>

      {(() => {
        const { stages, statuses, currentStage } = getStageInfo();
        return (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center">
                {stages.map((stage, i) => {
                  const st = statuses[i];
                  const isCompleted = st === "completed";
                  const isCurrent = st === "current";
                  const isFailed = st === "failed";
                  const isFuture = st === "future";
                  const connectorColor = isCompleted ? "bg-green-500" : isCurrent ? "bg-blue-400" : isFailed ? "bg-red-400" : "bg-gray-200";
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
      })()}

      <Card>
        <CardHeader>
          <CardTitle>Interview / Stage History</CardTitle>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <EmptyState message="No interviews recorded yet." />
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
                          <h4 className="font-semibold text-base">{iv.interview_type || "-"}</h4>
                          <Badge className={
                            iv.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                            iv.status === "SCHEDULED" ? "bg-blue-100 text-blue-800" :
                            iv.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }>{iv.status || "-"}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-sm mb-3">
                          <div><span className="text-muted-foreground">Rating/Score:</span> {iv.rating ?? "-"}</div>
                          <div><span className="text-muted-foreground">Interviewer:</span> {iv.interviewer || "-"}</div>
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

      <Card>
        <CardHeader>
          <CardTitle>Approval History</CardTitle>
        </CardHeader>
        <CardContent>
          {approvals.length === 0 ? (
            <EmptyState message="No approval records yet." />
          ) : (
            <div className="space-y-3">
              {approvals.map((a: any) => (
                <div key={a.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-base">{a.approval_type || "-"}</h4>
                    <Badge className={
                      a.decision === "APPROVED" ? "bg-green-100 text-green-800" :
                      a.decision === "REJECTED" ? "bg-red-100 text-red-800" :
                      a.decision === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }>{a.decision || "-"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-sm mb-3">
                    <div><span className="text-muted-foreground">Approved By:</span> {a.approved_by_name || a.approved_by || "-"}</div>
                    <div><span className="text-muted-foreground">Date:</span> {a.decided_at ? formatDateShort(a.decided_at) : a.created_at ? formatDateShort(a.created_at) : "-"}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Comments:</span>
                    <p className="mt-0.5 whitespace-pre-wrap">{a.comments || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {familyData.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.full_name}</TableCell>
                        <TableCell className="capitalize">{m.relationship_type}</TableCell>
                        <TableCell>{m.occupation || '—'}</TableCell>
                        <TableCell>{m.contact_number || '—'}</TableCell>
                        {isAdmin && (
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
            {isAdmin && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => { setEditingFamily({ relationship_type: "spouse", is_dependent: false }); setFamilyDialog({ open: true, mode: "create", item: null }); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Family Member
              </Button>
            )}
            {familyDialog.open && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onClick={() => setFamilyDialog({ open: false, mode: "create", item: null })}>
                <div className="bg-background rounded-lg border p-4 w-full max-w-md mx-4 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <p className="text-sm font-semibold">{familyDialog.mode === "create" ? "Add Family Member" : "Edit Family Member"}</p>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    <div>
                      <p className="text-xs text-muted-foreground">Full Name <span className="text-red-500">*</span></p>
                      <input value={editingFamily.full_name || ""} onChange={e => setEditingFamily({ ...editingFamily, full_name: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Relationship <span className="text-red-500">*</span></p>
                      <select value={editingFamily.relationship_type || ""} onChange={e => setEditingFamily({ ...editingFamily, relationship_type: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm">
                        <option value="">Select...</option>
                        <option value="spouse">Spouse</option>
                        <option value="child">Child</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="parent">Parent</option>
                        <option value="dependent">Dependent</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Birthdate</p>
                      <input type="date" value={editingFamily.birthdate || ""} onChange={e => setEditingFamily({ ...editingFamily, birthdate: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Occupation</p>
                      <input value={editingFamily.occupation || ""} onChange={e => setEditingFamily({ ...editingFamily, occupation: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Number</p>
                      <input value={editingFamily.contact_number || ""} onChange={e => setEditingFamily({ ...editingFamily, contact_number: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <input value={editingFamily.address || ""} onChange={e => setEditingFamily({ ...editingFamily, address: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editingFamily.is_dependent || false} onChange={e => setEditingFamily({ ...editingFamily, is_dependent: e.target.checked })} className="accent-primary" />
                      Is Dependent
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setFamilyDialog({ open: false, mode: "create", item: null })}>Cancel</Button>
                    <Button size="sm" onClick={familyDialog.mode === "create" ? handleCreateFamily : handleUpdateFamily}>{familyDialog.mode === "create" ? "Add" : "Save"}</Button>
                  </div>
                </div>
              </div>
            )}
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
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {educationData.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.school_name}</TableCell>
                        <TableCell className="capitalize">{e.education_level.replace('_', ' ')}</TableCell>
                        <TableCell>{e.course_or_degree || '—'}</TableCell>
                        <TableCell>{e.year_started || '—'}{e.year_graduated ? ` - ${e.year_graduated}` : ''}</TableCell>
                        {isAdmin && (
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
            {isAdmin && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => { setEditingEducation({ education_level: "college" }); setEducationDialog({ open: true, mode: "create", item: null }); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Education
              </Button>
            )}
            {educationDialog.open && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onClick={() => setEducationDialog({ open: false, mode: "create", item: null })}>
                <div className="bg-background rounded-lg border p-4 w-full max-w-md mx-4 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <p className="text-sm font-semibold">{educationDialog.mode === "create" ? "Add Education" : "Edit Education"}</p>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    <div>
                      <p className="text-xs text-muted-foreground">Education Level <span className="text-red-500">*</span></p>
                      <select value={editingEducation.education_level || ""} onChange={e => setEditingEducation({ ...editingEducation, education_level: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm">
                        <option value="">Select...</option>
                        <option value="elementary">Elementary</option>
                        <option value="high_school">High School</option>
                        <option value="college">College</option>
                        <option value="masters">Masters</option>
                        <option value="doctorate">Doctorate</option>
                        <option value="vocational">Vocational</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">School Name <span className="text-red-500">*</span></p>
                      <input value={editingEducation.school_name || ""} onChange={e => setEditingEducation({ ...editingEducation, school_name: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Course / Degree</p>
                      <input value={editingEducation.course_or_degree || ""} onChange={e => setEditingEducation({ ...editingEducation, course_or_degree: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Year Started</p>
                      <input type="number" value={editingEducation.year_started || ""} onChange={e => setEditingEducation({ ...editingEducation, year_started: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Year Graduated</p>
                      <input type="number" value={editingEducation.year_graduated || ""} onChange={e => setEditingEducation({ ...editingEducation, year_graduated: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Honors / Awards</p>
                      <textarea value={editingEducation.honors_awards || ""} onChange={e => setEditingEducation({ ...editingEducation, honors_awards: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm min-h-[60px]" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setEducationDialog({ open: false, mode: "create", item: null })}>Cancel</Button>
                    <Button size="sm" onClick={educationDialog.mode === "create" ? handleCreateEducation : handleUpdateEducation}>{educationDialog.mode === "create" ? "Add" : "Save"}</Button>
                  </div>
                </div>
              </div>
            )}
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
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {experienceData.map((x: any) => (
                      <TableRow key={x.id}>
                        <TableCell className="font-medium">{x.company_name}</TableCell>
                        <TableCell>{x.position}</TableCell>
                        <TableCell>{x.start_date?.split('T')[0] || '—'} to {x.end_date?.split('T')[0] || 'Present'}</TableCell>
                        <TableCell>{x.reason_for_leaving || '—'}</TableCell>
                        {isAdmin && (
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
            {isAdmin && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => { setEditingExperience({}); setExperienceDialog({ open: true, mode: "create", item: null }); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Work Experience
              </Button>
            )}
            {experienceDialog.open && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onClick={() => setExperienceDialog({ open: false, mode: "create", item: null })}>
                <div className="bg-background rounded-lg border p-4 w-full max-w-md mx-4 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <p className="text-sm font-semibold">{experienceDialog.mode === "create" ? "Add Work Experience" : "Edit Work Experience"}</p>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    <div>
                      <p className="text-xs text-muted-foreground">Company Name <span className="text-red-500">*</span></p>
                      <input value={editingExperience.company_name || ""} onChange={e => setEditingExperience({ ...editingExperience, company_name: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Position <span className="text-red-500">*</span></p>
                      <input value={editingExperience.position || ""} onChange={e => setEditingExperience({ ...editingExperience, position: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <input type="date" value={editingExperience.start_date || ""} onChange={e => setEditingExperience({ ...editingExperience, start_date: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <input type="date" value={editingExperience.end_date || ""} onChange={e => setEditingExperience({ ...editingExperience, end_date: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reason for Leaving</p>
                      <textarea value={editingExperience.reason_for_leaving || ""} onChange={e => setEditingExperience({ ...editingExperience, reason_for_leaving: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm min-h-[60px]" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setExperienceDialog({ open: false, mode: "create", item: null })}>Cancel</Button>
                    <Button size="sm" onClick={experienceDialog.mode === "create" ? handleCreateExperience : handleUpdateExperience}>{experienceDialog.mode === "create" ? "Add" : "Save"}</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>



      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Applicant</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <select name="status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                <option value="Initial">Initial</option>
                <option value="Pending">Pending</option>
                <option value="Final Interview">Final Interview</option>
                <option value="Exam Interview">Exam Interview</option>
                <option value="Completed">Completed</option>
                <option value="Fail">Fail</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Rating</p>
              <input name="rating" value={editForm.rating} onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" placeholder="1-10" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <textarea name="notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full border rounded px-2 py-1 bg-background min-h-[80px]" />
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
            <div>
              <p className="text-xs text-muted-foreground mb-1">Requirement Name <span className="text-red-500">*</span></p>
              <input
                value={reqForm.requirement_name}
                onChange={(e) => setReqForm({ ...reqForm, requirement_name: e.target.value })}
                className="w-full border rounded px-2 py-1 bg-background"
                placeholder="e.g., Diploma, NBI Clearance, Medical"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <select
                value={reqForm.status}
                onChange={(e) => setReqForm({ ...reqForm, status: e.target.value })}
                className="w-full border rounded px-2 py-1 bg-background"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Remarks</p>
              <textarea
                value={reqForm.remarks}
                onChange={(e) => setReqForm({ ...reqForm, remarks: e.target.value })}
                className="w-full border rounded px-2 py-1 bg-background min-h-[60px]"
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

            <div>
              <p className="text-xs text-muted-foreground mb-1">Branch</p>
              <select value={convertForm.branch_id} onChange={(e) => setConvertForm({ ...convertForm, branch_id: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Hired Date</p>
              <input type="date" value={convertForm.hired_date} onChange={(e) => setConvertForm({ ...convertForm, hired_date: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Probation Period (Months)</p>
              <input
                type="number"
                value={convertForm.probation_period_months}
                onChange={(e) => setConvertForm({ ...convertForm, probation_period_months: e.target.value })}
                className="w-full border rounded px-2 py-1 bg-background"
                min={1}
                max={24}
                placeholder="Company Default (6 months)"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank to use company default (6 months)</p>
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
    </div>
  );
};

export default ApplicantDetailPage;