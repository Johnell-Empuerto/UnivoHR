import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createRecruitmentWorkflow,
  updateRecruitmentWorkflow,
  deleteRecruitmentWorkflow,
  createWorkflowStage,
  updateWorkflowStage,
  deleteWorkflowStage,
  reorderWorkflowStages,
} from "@/services/recruitmentWorkflowService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/app/providers/AuthProvider";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import {
  Workflow, Plus, Pencil, Trash2, Loader2,
  ArrowUp, ArrowDown, GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatDate";
import { useRecruitmentWorkflowsList } from "../hooks/useRecruitmentWorkflowsList";
import { useWorkflowStages } from "../hooks/useWorkflowStages";

interface Workflow {
  id: number;
  name: string;
  description: string | null;
  branch_id: number | null;
  branch_name: string | null;
  branch_code: string | null;
  job_position_id: number | null;
  job_position_title: string | null;
  is_default: boolean;
  is_active: boolean;
  version: number;
  created_at: string;
}

interface Stage {
  id: number;
  workflow_id: number;
  stage_name: string;
  stage_type: string;
  stage_category: string | null;
  sequence_order: number;
  is_required: boolean;
  requires_assignment: boolean;
  requires_score: boolean;
  requires_approval: boolean;
  passing_score: number | null;
  next_stage_on_pass: number | null;
  next_stage_on_fail: number | null;
  allow_skip: boolean;
  auto_proceed_on_pass: boolean;
  days_to_complete: number | null;
  is_terminal: boolean;
}

const STAGE_TYPES = [
  "INTERVIEW", "EXAM", "APPROVAL", "DOCUMENT_CHECK",
  "MEDICAL", "BACKGROUND_CHECK", "OFFER", "ONBOARDING",
  "CONVERT_TO_EMPLOYEE", "CUSTOM",
];

const STAGE_TYPE_COLORS: Record<string, string> = {
  INTERVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  EXAM: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  APPROVAL: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  DOCUMENT_CHECK: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  MEDICAL: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  BACKGROUND_CHECK: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  OFFER: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  ONBOARDING: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  CONVERT_TO_EMPLOYEE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  CUSTOM: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
};

const RecruitmentWorkflowsPage = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("recruitment.workflows.manage");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_default: false,
    is_active: true,
  });

  const [stagesWorkflowId, setStagesWorkflowId] = useState<number | null>(null);
  const [stagesDialogOpen, setStagesDialogOpen] = useState(false);

  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [savingStage, setSavingStage] = useState(false);
  const [stageForm, setStageForm] = useState({
    stage_name: "",
    stage_type: "INTERVIEW",
    stage_category: "",
    sequence_order: 1,
    is_required: true,
    requires_assignment: false,
    requires_score: false,
    requires_approval: false,
    passing_score: "",
    allow_skip: false,
    auto_proceed_on_pass: false,
    days_to_complete: "",
    is_terminal: false,
  });

  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);
  const [deleteStageTarget, setDeleteStageTarget] = useState<Stage | null>(null);

  const invalidateWorkflows = () => queryClient.invalidateQueries({ queryKey: ["recruitment-workflows"] });
  const invalidateStages = () => queryClient.invalidateQueries({ queryKey: ["workflow-stages", stagesWorkflowId] });

  const { data: workflowsResult, isLoading } = useRecruitmentWorkflowsList(page, Number(pageSize), search, isActiveFilter);
  const workflows = workflowsResult?.data ?? [];
  const total = workflowsResult?.pagination?.total ?? 0;

  const { data: stages = [], isLoading: stagesLoading } = useWorkflowStages(stagesWorkflowId);

  const openCreateDialog = () => {
    setEditId(null);
    setForm({ name: "", description: "", is_default: false, is_active: true });
    setDialogOpen(true);
  };

  const openEditDialog = (wf: Workflow) => {
    setEditId(wf.id);
    setForm({
      name: wf.name,
      description: wf.description || "",
      is_default: wf.is_default,
      is_active: wf.is_active,
    });
    setDialogOpen(true);
  };

  const handleSaveWorkflow = async () => {
    if (!form.name.trim()) { toast.error("Workflow name is required"); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateRecruitmentWorkflow(editId, form);
        toast.success("Workflow updated");
      } else {
        await createRecruitmentWorkflow(form);
        toast.success("Workflow created");
      }
      setDialogOpen(false);
      invalidateWorkflows();
    } catch (err: any) {
      toast.error(err.message || "Failed to save workflow");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await deleteRecruitmentWorkflow(deleteTarget.id);
      toast.success("Workflow deleted");
      setDeleteTarget(null);
      invalidateWorkflows();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete workflow");
    } finally {
      setSaving(false);
    }
  };

  const openStagesDialog = (wf: Workflow) => {
    setStagesWorkflowId(wf.id);
    setStagesDialogOpen(true);
  };

  const closeStagesDialog = () => {
    setStagesDialogOpen(false);
    setStagesWorkflowId(null);
    setStageFormOpen(false);
    setEditingStage(null);
  };

  const openCreateStageForm = () => {
    const nextOrder = stages.length > 0 ? Math.max(...stages.map((s: any) => s.sequence_order)) + 1 : 1;
    setEditingStage(null);
    setStageForm({
      stage_name: "",
      stage_type: "INTERVIEW",
      stage_category: "",
      sequence_order: nextOrder,
      is_required: true,
      requires_assignment: false,
      requires_score: false,
      requires_approval: false,
      passing_score: "",
      allow_skip: false,
      auto_proceed_on_pass: false,
      days_to_complete: "",
      is_terminal: false,
    });
    setStageFormOpen(true);
  };

  const openEditStageForm = (stage: Stage) => {
    setEditingStage(stage);
    setStageForm({
      stage_name: stage.stage_name,
      stage_type: stage.stage_type,
      stage_category: stage.stage_category || "",
      sequence_order: stage.sequence_order,
      is_required: stage.is_required,
      requires_assignment: stage.requires_assignment,
      requires_score: stage.requires_score,
      requires_approval: stage.requires_approval,
      passing_score: stage.passing_score !== null ? String(stage.passing_score) : "",
      allow_skip: stage.allow_skip,
      auto_proceed_on_pass: stage.auto_proceed_on_pass,
      days_to_complete: stage.days_to_complete !== null ? String(stage.days_to_complete) : "",
      is_terminal: stage.is_terminal,
    });
    setStageFormOpen(true);
  };

  const handleSaveStage = async () => {
    if (!stageForm.stage_name.trim()) { toast.error("Stage name is required"); return; }
    setSavingStage(true);
    try {
      const payload = {
        ...stageForm,
        passing_score: stageForm.passing_score ? Number(stageForm.passing_score) : null,
        days_to_complete: stageForm.days_to_complete ? Number(stageForm.days_to_complete) : null,
      };
      if (editingStage) {
        await updateWorkflowStage(editingStage.id, payload);
        toast.success("Stage updated");
      } else if (stagesWorkflowId) {
        await createWorkflowStage(stagesWorkflowId, payload);
        toast.success("Stage created");
      }
      setStageFormOpen(false);
      setEditingStage(null);
      invalidateStages();
    } catch (err: any) {
      toast.error(err.message || "Failed to save stage");
    } finally {
      setSavingStage(false);
    }
  };

  const handleDeleteStageConfirm = async () => {
    if (!deleteStageTarget) return;
    try {
      setSavingStage(true);
      await deleteWorkflowStage(deleteStageTarget.id);
      toast.success("Stage deleted");
      setDeleteStageTarget(null);
      invalidateStages();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete stage");
    } finally {
      setSavingStage(false);
    }
  };

  const moveStage = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;
    const reordered = [...stages];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const orderedIds = reordered.map(s => s.id);
    try {
      if (stagesWorkflowId) {
        await reorderWorkflowStages(stagesWorkflowId, orderedIds);
        invalidateStages();
        toast.success("Stages reordered");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reorder stages");
    }
  };

  const stageTypeBadge = (type: string) => (
    <Badge className={STAGE_TYPE_COLORS[type] || "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"}>
      {type}
    </Badge>
  );

  if (!canManage) {
    return <EmptyState message="You do not have permission to manage recruitment workflows." />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Workflow className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">Recruitment Workflows</h1>
          <p className="text-sm text-muted-foreground">Manage workflow templates for recruitment pipelines</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search workflows..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-64"
            />
            <Select value={isActiveFilter} onValueChange={(v) => { setIsActiveFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Workflow
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader message="Loading workflows..." />
          ) : workflows.length === 0 ? (
            <EmptyState message="No workflows found. Create your first recruitment workflow template." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Job Position</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((wf: any) => (
                    <TableRow key={wf.id}>
                      <TableCell className="font-medium">{wf.name}</TableCell>
                      <TableCell>
                        {wf.is_active
                          ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                          : <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400">Inactive</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        {wf.is_default ? <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Default</Badge> : "-"}
                      </TableCell>
                      <TableCell>v{wf.version}</TableCell>
                      <TableCell className="text-muted-foreground">{wf.branch_name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{wf.job_position_title || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {wf.created_at ? formatDate(wf.created_at) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" title="Edit Stages" onClick={() => openStagesDialog(wf)}>
                            <GripVertical className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => openEditDialog(wf)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Delete" onClick={() => setDeleteTarget(wf)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <TablePagination
            page={page}
            totalPages={Math.ceil(total / Number(pageSize))}
            totalItems={total}
            pageSize={Number(pageSize)}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(String(size)); setPage(1); }}
          />
        </CardContent>
      </Card>

      {/* Workflow Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Workflow" : "Add Workflow"}</DialogTitle>
            <DialogDescription>
              {editId ? "Update the workflow template details below." : "Fill in the details for the new recruitment workflow template."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Standard Hiring Pipeline" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="accent-primary" />
                Is Default
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-primary" />
                Is Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveWorkflow} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stages Dialog */}
      <Dialog open={stagesDialogOpen} onOpenChange={(open) => { if (!open) closeStagesDialog(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Stages</DialogTitle>
            <DialogDescription>Manage the stages for this recruitment workflow.</DialogDescription>
          </DialogHeader>
          {stagesLoading ? (
            <Loader message="Loading stages..." />
          ) : (
            <div className="space-y-3 pt-2">
              {stages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No stages yet. Add the first stage.</p>
              )}
              {stages.map((stage: any, index: any) => (
                <div key={stage.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex flex-col gap-1 pt-1">
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                      disabled={index === 0} onClick={() => moveStage(index, "up")} title="Move up">
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                      disabled={index === stages.length - 1} onClick={() => moveStage(index, "down")} title="Move down">
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{stage.stage_name}</span>
                      {stageTypeBadge(stage.stage_type)}
                      {stage.stage_category && (
                        <span className="text-xs text-muted-foreground">({stage.stage_category})</span>
                      )}
                      {stage.is_terminal && <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Terminal</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {stage.requires_assignment && <span>Assignment</span>}
                      {stage.requires_score && <span>Scored</span>}
                      {stage.requires_approval && <span>Requires Approval</span>}
                      {stage.passing_score !== null && <span>Pass: {stage.passing_score}</span>}
                      {stage.days_to_complete !== null && <span>SLA: {stage.days_to_complete}d</span>}
                      {!stage.is_required && <span>Optional</span>}
                      {stage.allow_skip && <span>Skippable</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditStageForm(stage)} title="Edit stage">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteStageTarget(stage)} title="Delete stage">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={openCreateStageForm}>
                <Plus className="h-4 w-4 mr-2" /> Add Stage
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stage Create/Edit Dialog */}
      <Dialog open={stageFormOpen} onOpenChange={setStageFormOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStage ? "Edit Stage" : "Add Stage"}</DialogTitle>
            <DialogDescription>
              {editingStage ? "Update the stage details below." : "Fill in the details for the new workflow stage."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Stage Name <span className="text-red-500">*</span></Label>
              <Input value={stageForm.stage_name}
                onChange={(e) => setStageForm({ ...stageForm, stage_name: e.target.value })}
                placeholder="e.g., Technical Interview" />
            </div>
            <div className="space-y-1">
              <Label>Stage Type <span className="text-red-500">*</span></Label>
              <Select
                value={stageForm.stage_type}
                onValueChange={(v) => setStageForm({ ...stageForm, stage_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Stage Category</Label>
              <Input value={stageForm.stage_category}
                onChange={(e) => setStageForm({ ...stageForm, stage_category: e.target.value })}
                placeholder="e.g., Technical, Panel, HR" />
            </div>
            <div className="space-y-1">
              <Label>Sequence Order</Label>
              <Input type="number" min={1} value={stageForm.sequence_order}
                onChange={(e) => setStageForm({ ...stageForm, sequence_order: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={stageForm.is_required}
                  onChange={(e) => setStageForm({ ...stageForm, is_required: e.target.checked })} className="accent-primary" />
                Is Required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={stageForm.requires_assignment}
                  onChange={(e) => setStageForm({ ...stageForm, requires_assignment: e.target.checked })} className="accent-primary" />
                Requires Assignment
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={stageForm.requires_score}
                  onChange={(e) => setStageForm({ ...stageForm, requires_score: e.target.checked })} className="accent-primary" />
                Requires Score
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={stageForm.requires_approval}
                  onChange={(e) => setStageForm({ ...stageForm, requires_approval: e.target.checked })} className="accent-primary" />
                Requires Approval
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={stageForm.allow_skip}
                  onChange={(e) => setStageForm({ ...stageForm, allow_skip: e.target.checked })} className="accent-primary" />
                Allow Skip
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={stageForm.auto_proceed_on_pass}
                  onChange={(e) => setStageForm({ ...stageForm, auto_proceed_on_pass: e.target.checked })} className="accent-primary" />
                Auto Proceed
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={stageForm.is_terminal}
                  onChange={(e) => setStageForm({ ...stageForm, is_terminal: e.target.checked })} className="accent-primary" />
                Is Terminal
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Passing Score</Label>
                <Input type="number" min={0} step={0.01} value={stageForm.passing_score}
                  onChange={(e) => setStageForm({ ...stageForm, passing_score: e.target.value })}
                  placeholder="Optional" />
              </div>
              <div className="space-y-1">
                <Label>Days to Complete</Label>
                <Input type="number" min={1} value={stageForm.days_to_complete}
                  onChange={(e) => setStageForm({ ...stageForm, days_to_complete: e.target.value })}
                  placeholder="Optional" />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setStageFormOpen(false)} disabled={savingStage}>Cancel</Button>
            <Button onClick={handleSaveStage} disabled={savingStage}>
              {savingStage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingStage ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workflow Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone if it is not assigned to any job positions or applicants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Stage Confirmation */}
      <AlertDialog open={!!deleteStageTarget} onOpenChange={(open) => { if (!open) setDeleteStageTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteStageTarget?.stage_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStageConfirm} disabled={savingStage}>
              {savingStage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RecruitmentWorkflowsPage;
