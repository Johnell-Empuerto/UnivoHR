import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyInterviews,
  updateApplicantInterview,
} from "@/services/applicantInterviewService";
import {
  updateApplicant as updateApplicantStatus,
  getMyWorkflowStageAssignments,
  completeWorkflowStage,
  moveToNextWorkflowStage,
  failApplicantWorkflow,
} from "@/services/applicantService";
import { formatDateTimeLocal } from "@/utils/formatDate";
import { useAuth } from "@/app/providers/AuthProvider";
import ErrorMessage from "@/components/shared/ErrorMessage";
import Loader from "@/components/shared/Loader";
import { TablePagination } from "@/components/shared/TablePagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  Eye,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Interview = {
  id: number;
  applicant_id: number;
  applicant_first_name: string;
  applicant_middle_name: string | null;
  applicant_last_name: string;
  applicant_status: string;
  position_title: string | null;
  position_department: string | null;
  interview_type: string | null;
  interview_date: string | null;
  status: string;
  rating: number | null;
  recommendation: string | null;
  notes: string | null;
  interviewer_name: string | null;
  interviewer_user_id: number | null;
  created_at: string;
};

type DynamicStageAssignment = {
  stage_record_id: number;
  applicant_id: number;
  applicant_name: string;
  applicant_status: string;
  job_title: string | null;
  workflow_name: string;
  stage_name: string;
  stage_type: string;
  status: string;
  scheduled_at: string | null;
  score: number | null;
  recommendation: string | null;
  comments: string | null;
  assigned_user_id: number | null;
  assigned_employee_id: number | null;
  assigned_name: string | null;
  is_current: boolean;
};

type UpdatePayload = {
  status?: string;
  rating?: number | null;
  recommendation?: string | null;
  notes?: string | null;
};

type Tab = "all" | "table";

const STATUS_OPTIONS = ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"];
const RECOMMENDATION_OPTIONS = ["PASSED", "FAILED", "FOR_REVIEW"];

const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    INTERVIEW: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    EXAM: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    APPROVAL: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return map[type] || "bg-gray-100 text-gray-800";
};

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    RESCHEDULED: "bg-yellow-100 text-yellow-800",
    PENDING: "bg-yellow-100 text-yellow-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
};

const getRecommendationBadge = (rec: string | null) => {
  if (!rec) return null;
  const map: Record<string, string> = {
    PASSED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    FOR_REVIEW: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[rec] || "bg-gray-100 text-gray-800"}`}>
      {rec}
    </span>
  );
};

const MyInterviewAssignmentsPage = () => {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("table");

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [dynamicStages, setDynamicStages] = useState<DynamicStageAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [recommendationFilter, setRecommendationFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [updating, setUpdating] = useState(false);
  const [updateId, setUpdateId] = useState<number | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdatePayload>({});
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const [stageConfirm, setStageConfirm] = useState<{
    open: boolean;
    suggestedStage: string;
    interviewType: string;
    applicantId: number;
  }>({ open: false, suggestedStage: "", interviewType: "", applicantId: 0 });

  const getSuggestedStageFromInterview = (interviewType: string | null, recommendation: string | null): string | null => {
    if (recommendation === "FAILED") return "Fail";
    if (recommendation === "FOR_REVIEW") return null;
    if (recommendation !== "PASSED") return null;
    const map: Record<string, string> = {
      "Initial Interview": "Exam Interview",
      "Exam Interview": "Final Interview",
      "Final Interview": "Completed",
    };
    return (interviewType && map[interviewType]) || null;
  };

  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [interviewsData, dynamicData] = await Promise.all([
        getMyInterviews().catch(() => []),
        getMyWorkflowStageAssignments().catch(() => []),
      ]);
      setInterviews(Array.isArray(interviewsData) ? interviewsData : []);
      setDynamicStages(Array.isArray(dynamicData) ? dynamicData : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const interviewFiltered = interviews.filter((iv) => {
    if (searchInput) {
      const q = searchInput.toLowerCase();
      const name = `${iv.applicant_first_name || ""} ${iv.applicant_last_name || ""}`.toLowerCase();
      const pos = (iv.position_title || "").toLowerCase();
      if (!name.includes(q) && !pos.includes(q)) return false;
    }
    if (statusFilter !== "ALL" && iv.status !== statusFilter) return false;
    if (recommendationFilter !== "ALL" && (iv.recommendation || "") !== recommendationFilter) return false;
    return true;
  });

  const dynamicStageFiltered = dynamicStages.filter((ds) => {
    if (searchInput) {
      const q = searchInput.toLowerCase();
      const name = (ds.applicant_name || "").toLowerCase();
      const pos = (ds.job_title || "").toLowerCase();
      if (!name.includes(q) && !pos.includes(q)) return false;
    }
    if (statusFilter !== "ALL" && ds.status !== statusFilter) return false;
    if (recommendationFilter !== "ALL" && ds.recommendation && ds.recommendation !== recommendationFilter) return false;
    return true;
  });

  const allItems = [
    ...interviewFiltered.map((iv) => ({ type: "legacy_interview" as const, item: iv })),
    ...dynamicStageFiltered.map((ds) => ({ type: "dynamic_stage" as const, item: ds })),
  ];

  const interviewPages = Math.max(1, Math.ceil((activeTab === "table" ? dynamicStageFiltered.length + interviewFiltered.length : allItems.length) / rowsPerPage));
  const interviewStartIdx = (currentPage - 1) * rowsPerPage;
  const interviewPageData = interviewFiltered.slice(interviewStartIdx, interviewStartIdx + rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, statusFilter, recommendationFilter, activeTab]);

  const openUpdateDialog = (iv: Interview) => {
    setEditingInterview(iv);
    setUpdateId(iv.id);
    setUpdateForm({
      status: iv.status,
      rating: iv.rating,
      recommendation: iv.recommendation,
      notes: iv.notes,
    });
    setShowUpdateDialog(true);
  };

  const handleUpdate = async () => {
    if (updateId === null) return;
    setUpdating(true);
    try {
      const updated = await updateApplicantInterview(updateId, updateForm);
      setShowUpdateDialog(false);
      setUpdateId(null);

      const rec = updated.recommendation || updateForm.recommendation;
      const it = editingInterview?.interview_type || null;
      const aid = editingInterview?.applicant_id;

      setUpdating(false);

      if (rec === "FOR_REVIEW") {
        toast.success("Interview marked for review. Applicant stage unchanged.");
        setEditingInterview(null);
        fetchAll();
      } else {
        const suggested = getSuggestedStageFromInterview(it, rec);
        if (suggested && aid) {
          setStageConfirm({ open: true, suggestedStage: suggested, interviewType: it || "", applicantId: aid });
        } else {
          toast.success("Interview updated successfully");
          setEditingInterview(null);
          fetchAll();
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Update failed");
      setUpdating(false);
    }
  };

  const handleConfirmStageUpdate = async () => {
    if (!stageConfirm.suggestedStage || !stageConfirm.applicantId) return;
    setUpdating(true);
    try {
      await updateApplicantStatus(stageConfirm.applicantId, { status: stageConfirm.suggestedStage });
      toast.success(
        stageConfirm.suggestedStage === "Fail"
          ? "Applicant marked as Fail."
          : `Applicant moved to ${stageConfirm.suggestedStage}.`,
      );
      setStageConfirm({ open: false, suggestedStage: "", interviewType: "", applicantId: 0 });
      setEditingInterview(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to update applicant stage");
      setStageConfirm({ open: false, suggestedStage: "", interviewType: "", applicantId: 0 });
      setEditingInterview(null);
      setUpdating(false);
    }
  };

  const handleCancelStageUpdate = () => {
    toast.success("Interview result saved. Applicant stage unchanged.");
    setStageConfirm({ open: false, suggestedStage: "", interviewType: "", applicantId: 0 });
    setEditingInterview(null);
    setUpdating(false);
    fetchAll();
  };

  const [dynamicUpdateDialog, setDynamicUpdateDialog] = useState<{ open: boolean; stage: DynamicStageAssignment | null }>({ open: false, stage: null });
  const [dynamicUpdateForm, setDynamicUpdateForm] = useState({ score: "", recommendation: "", comments: "" });
  const [dynamicUpdateProcessing, setDynamicUpdateProcessing] = useState(false);
  const [dynamicConfirm, setDynamicConfirm] = useState<{ open: boolean; action: "MOVE_NEXT" | "FAIL" | null; stageRecordId: number | null; applicantId: number | null }>({ open: false, action: null, stageRecordId: null, applicantId: null });

  const openDynamicUpdateDialog = (ds: DynamicStageAssignment) => {
    setDynamicUpdateForm({
      score: ds.score !== null && ds.score !== undefined ? String(ds.score) : "",
      recommendation: ds.recommendation || "",
      comments: ds.comments || "",
    });
    setDynamicUpdateDialog({ open: true, stage: ds });
  };

  const handleDynamicUpdateSubmit = async () => {
    const stage = dynamicUpdateDialog.stage;
    if (!stage) return;
    if (!dynamicUpdateForm.recommendation) {
      toast.error("Recommendation is required");
      return;
    }
    try {
      setDynamicUpdateProcessing(true);
      const payload: any = { recommendation: dynamicUpdateForm.recommendation, comments: dynamicUpdateForm.comments || null };
      if (dynamicUpdateForm.score) payload.score = Number(dynamicUpdateForm.score);
      await completeWorkflowStage(stage.stage_record_id, payload);
      setDynamicUpdateDialog({ open: false, stage: null });
      if (dynamicUpdateForm.recommendation === "PASSED") {
        setDynamicConfirm({ open: true, action: "MOVE_NEXT", stageRecordId: stage.stage_record_id, applicantId: stage.applicant_id });
      } else if (dynamicUpdateForm.recommendation === "FAILED") {
        setDynamicConfirm({ open: true, action: "FAIL", stageRecordId: stage.stage_record_id, applicantId: stage.applicant_id });
      } else {
        toast.success("Stage completed");
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to complete stage");
    } finally {
      setDynamicUpdateProcessing(false);
    }
  };

  const handleDynamicConfirm = async () => {
    if (!dynamicConfirm.stageRecordId || !dynamicConfirm.applicantId) return;
    try {
      setDynamicUpdateProcessing(true);
      if (dynamicConfirm.action === "MOVE_NEXT") {
        await moveToNextWorkflowStage(dynamicConfirm.applicantId, dynamicConfirm.stageRecordId);
        toast.success("Applicant moved to next stage");
      } else if (dynamicConfirm.action === "FAIL") {
        await failApplicantWorkflow(dynamicConfirm.applicantId, dynamicConfirm.stageRecordId);
        toast.success("Applicant marked as failed");
      }
      setDynamicConfirm({ open: false, action: null, stageRecordId: null, applicantId: null });
      setDynamicUpdateDialog({ open: false, stage: null });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Action failed");
    } finally {
      setDynamicUpdateProcessing(false);
    }
  };

  const handleDynamicConfirmCancel = () => {
    setDynamicConfirm({ open: false, action: null, stageRecordId: null, applicantId: null });
    fetchAll();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "table", label: "List View" },
  ];

  if (loading) return <Loader message="Loading assignments..." />;
  if (error) return <ErrorMessage message={error} title="Error Loading Assignments" />;

  const renderTableView = () => (
    <>
      {interviewFiltered.length === 0 && dynamicStageFiltered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">No recruitment assignments yet.</p>
            <p className="text-sm">Assigned applicant workflow tasks will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Applicant</th>
                  <th className="text-left px-4 py-3 font-medium">Position</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Schedule</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Score</th>
                  <th className="text-left px-4 py-3 font-medium">Recommendation</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {interviewPageData.map((iv) => (
                  <tr key={`iv-${iv.id}`} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {iv.applicant_first_name} {iv.applicant_last_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {iv.position_title || "-"}
                      {iv.position_department && (
                        <div className="text-xs text-muted-foreground/70">{iv.position_department}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge(iv.interview_type?.includes("Exam") ? "EXAM" : "INTERVIEW")}`}>
                        {iv.interview_type || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {iv.interview_date ? formatDateTimeLocal(iv.interview_date) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(iv.status)}`}>
                        {iv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      {iv.rating !== null && iv.rating !== undefined ? iv.rating : "-"}
                    </td>
                    <td className="px-4 py-3">{getRecommendationBadge(iv.recommendation)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/recruitment/applicants/${iv.applicant_id}`)}
                          title="View Applicant"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasPermission("recruitment.interviews.manage") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateDialog(iv)}
                          >
                            Update Result
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={currentPage}
            totalPages={interviewPages}
            totalItems={activeTab === "table" ? dynamicStageFiltered.length + interviewFiltered.length : allItems.length}
            pageSize={rowsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={() => {}}
            showPageSize={false}
          />
          </div>
        </>
      )}
    </>
  );

  const renderCombinedAll = () => {
    const combined: { date: string | null; type: string; element: React.ReactNode }[] = [];

    interviewFiltered.forEach((iv) => {
      combined.push({
        date: iv.interview_date,
        type: iv.interview_type?.includes("Exam") ? "EXAM" : "INTERVIEW",
        element: (
          <Card key={`all-iv-${iv.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{iv.applicant_first_name} {iv.applicant_last_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge(iv.interview_type?.includes("Exam") ? "EXAM" : "INTERVIEW")}`}>
                      {iv.interview_type || "INTERVIEW"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(iv.status)}`}>{iv.status}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{iv.position_title || "-"}</div>
                  {iv.interview_date && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Schedule:</span> {formatDateTimeLocal(iv.interview_date)}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <span><span className="text-muted-foreground">Score:</span> {iv.rating !== null && iv.rating !== undefined ? iv.rating : "-"}</span>
                    <span>{getRecommendationBadge(iv.recommendation)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/recruitment/applicants/${iv.applicant_id}`)}>
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  {hasPermission("recruitment.interviews.manage") && (
                    <Button variant="outline" size="sm" onClick={() => openUpdateDialog(iv)}>
                      Update Result
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ),
      });
    });

    dynamicStageFiltered.forEach((ds) => {
      combined.push({
        date: ds.scheduled_at,
        type: ds.stage_type,
        element: (
          <Card key={`all-ds-${ds.stage_record_id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{ds.applicant_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge(ds.stage_type)}`}>{ds.stage_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ds.status)}`}>{ds.status}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{ds.job_title || "-"}</div>
                  {ds.workflow_name && <div className="text-sm"><span className="text-muted-foreground">Workflow:</span> {ds.workflow_name}</div>}
                  <div className="text-sm"><span className="text-muted-foreground">Stage:</span> {ds.stage_name}</div>
                  {ds.scheduled_at && <div className="text-sm"><span className="text-muted-foreground">Schedule:</span> {formatDateTimeLocal(ds.scheduled_at)}</div>}
                  <div className="flex items-center gap-3 text-sm">
                    <span><span className="text-muted-foreground">Score:</span> {ds.score !== null && ds.score !== undefined ? ds.score : "-"}</span>
                    <span>{getRecommendationBadge(ds.recommendation)}</span>
                  </div>
                  {ds.comments && <div className="text-sm text-muted-foreground italic">"{ds.comments}"</div>}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/recruitment/applicants/${ds.applicant_id}`)}>
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  {ds.status !== "COMPLETED" && ds.status !== "FAILED" && (
                    <>
                      {ds.stage_type === "CONVERT_TO_EMPLOYEE" ? (
                        <Button size="sm" onClick={() => navigate(`/recruitment/applicants/${ds.applicant_id}`)}>
                          View & Convert
                        </Button>
                      ) : ["INTERVIEW", "EXAM", "CUSTOM"].includes(ds.stage_type) ? (
                        <Button variant="outline" size="sm" onClick={() => openDynamicUpdateDialog(ds)}>
                          Update Result
                        </Button>
                      ) : ds.stage_type === "APPROVAL" ? (
                        <Button variant="outline" size="sm" onClick={() => navigate(`/recruitment/applicants/${ds.applicant_id}`)}>
                          Review Approval
                        </Button>
                      ) : ["DOCUMENT_CHECK"].includes(ds.stage_type) ? (
                        <Button variant="outline" size="sm" onClick={() => openDynamicUpdateDialog(ds)}>
                          Complete Stage
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => openDynamicUpdateDialog(ds)}>
                          Update
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ),
      });
    });
    combined.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    if (combined.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">No assignments yet.</p>
            <p className="text-sm">Assigned applicant workflow tasks will appear here.</p>
          </CardContent>
        </Card>
      );
    }

    return <div className="space-y-3">{combined.map((c) => c.element)}</div>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Recruitment Assignments</h1>
          <p className="text-sm text-muted-foreground">Assigned applicant workflow tasks</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.key === "table" && (interviewFiltered.length + dynamicStageFiltered.length) > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary">{interviewFiltered.length + dynamicStageFiltered.length}</span>
            )}
            {t.key === "all" && (interviewFiltered.length + dynamicStageFiltered.length) > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary">{interviewFiltered.length + dynamicStageFiltered.length}</span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applicant name or position..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Recommendations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Recommendations</SelectItem>
                {RECOMMENDATION_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {activeTab === "table" && (
        <div className="space-y-6">
          {renderTableView()}
          {dynamicStageFiltered.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Dynamic Workflow Stages</h2>
              {dynamicStageFiltered.map((ds) => (
                <Card key={`ds-${ds.stage_record_id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{ds.applicant_name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge(ds.stage_type)}`}>{ds.stage_type}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ds.status)}`}>{ds.status}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{ds.job_title || "-"}</div>
                        {ds.workflow_name && <div className="text-sm"><span className="text-muted-foreground">Workflow:</span> {ds.workflow_name}</div>}
                        <div className="text-sm"><span className="text-muted-foreground">Stage:</span> {ds.stage_name}</div>
                        {ds.scheduled_at && <div className="text-sm"><span className="text-muted-foreground">Schedule:</span> {formatDateTimeLocal(ds.scheduled_at)}</div>}
                        <div className="flex items-center gap-3 text-sm">
                          <span><span className="text-muted-foreground">Score:</span> {ds.score !== null && ds.score !== undefined ? ds.score : "-"}</span>
                          <span>{getRecommendationBadge(ds.recommendation)}</span>
                        </div>
                        {ds.comments && <div className="text-sm text-muted-foreground italic">"{ds.comments}"</div>}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/recruitment/applicants/${ds.applicant_id}`)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        {hasPermission("recruitment.applicants.manage") && ds.status !== "COMPLETED" && (
                          <Button variant="outline" size="sm" onClick={() => openDynamicUpdateDialog(ds)}>
                            Update Result
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === "all" && renderCombinedAll()}

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Interview Result</DialogTitle>
            <DialogDescription>
              Update the score, status, recommendation, or notes for this interview.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={updateForm.status || ""}
                onValueChange={(v) => setUpdateForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Score / Rating (0–10)</label>
              <Input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={updateForm.rating ?? ""}
                onChange={(e) =>
                  setUpdateForm((f) => ({
                    ...f,
                    rating: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
                placeholder="Enter score"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recommendation</label>
              <Select
                value={updateForm.recommendation || "NONE"}
                onValueChange={(v) =>
                  setUpdateForm((f) => ({ ...f, recommendation: v === "NONE" ? null : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {RECOMMENDATION_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={updateForm.notes || ""}
                onChange={(e) =>
                  setUpdateForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Interview notes"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowUpdateDialog(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
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
            <Button variant="outline" onClick={handleCancelStageUpdate} disabled={updating}>
              Keep Current Stage
            </Button>
            <Button onClick={handleConfirmStageUpdate} disabled={updating}>
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yes, {stageConfirm.suggestedStage === "Fail" ? "Mark as Fail" : `Move to ${stageConfirm.suggestedStage}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dynamicUpdateDialog.open} onOpenChange={(open) => !open && setDynamicUpdateDialog({ open: false, stage: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Stage Result</DialogTitle>
            <DialogDescription>
              {dynamicUpdateDialog.stage && <>Update result for <strong>{dynamicUpdateDialog.stage.stage_name}</strong> — <strong>{dynamicUpdateDialog.stage.applicant_name}</strong></>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium mb-1">Score</label>
              <input type="number" min="0" max="100" step="0.5"
                value={dynamicUpdateForm.score}
                onChange={(e) => setDynamicUpdateForm({ ...dynamicUpdateForm, score: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                placeholder="Enter score" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recommendation <span className="text-red-500">*</span></label>
              <select value={dynamicUpdateForm.recommendation}
                onChange={(e) => setDynamicUpdateForm({ ...dynamicUpdateForm, recommendation: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm bg-background">
                <option value="">Select recommendation</option>
                <option value="PASSED">PASSED</option>
                <option value="FAILED">FAILED</option>
                <option value="FOR_REVIEW">FOR REVIEW</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Comments</label>
              <textarea value={dynamicUpdateForm.comments}
                onChange={(e) => setDynamicUpdateForm({ ...dynamicUpdateForm, comments: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm bg-background min-h-[80px]"
                placeholder="Stage comments" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDynamicUpdateDialog({ open: false, stage: null })} disabled={dynamicUpdateProcessing}>Cancel</Button>
            <Button onClick={handleDynamicUpdateSubmit} disabled={dynamicUpdateProcessing}>
              {dynamicUpdateProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete Stage
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dynamicConfirm.open} onOpenChange={(open) => !open && handleDynamicConfirmCancel()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{dynamicConfirm.action === "MOVE_NEXT" ? "Move to Next Stage?" : "Mark Workflow as Failed?"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {dynamicConfirm.action === "MOVE_NEXT"
              ? "The applicant passed this stage. Move them to the next stage in the workflow?"
              : "The applicant failed this stage. Mark the entire workflow as failed?"}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleDynamicConfirmCancel} disabled={dynamicUpdateProcessing}>
              {dynamicConfirm.action === "MOVE_NEXT" ? "Keep Current Stage" : "Keep Active"}
            </Button>
            <Button onClick={handleDynamicConfirm} disabled={dynamicUpdateProcessing}
              className={dynamicConfirm.action === "MOVE_NEXT" ? "" : "bg-red-600 hover:bg-red-700"}>
              {dynamicUpdateProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dynamicConfirm.action === "MOVE_NEXT" ? "Yes, Move to Next" : "Yes, Fail Workflow"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyInterviewAssignmentsPage;
