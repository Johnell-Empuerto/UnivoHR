import { useState, useEffect } from "react";
import {
  getJobPositions,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition,
} from "@/services/jobPositionService";
import { getActiveBranches } from "@/services/branchService";
import { getRecruitmentWorkflows } from "@/services/recruitmentWorkflowService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClassByStatus } from "@/utils/statusBadge";
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
import { TablePagination } from "@/components/shared/TablePagination";
import {
  Briefcase, Plus, Loader2, Pencil, Trash2,
  CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatDate";

interface JobPosition {
  id: number;
  title: string;
  department: string | null;
  description: string | null;
  requirements: string | null;
  salary_range: string | null;
  status: string;
  employment_type: string | null;
  branch_id: number | null;
  branch_name: string | null;
  branch_code: string | null;
  workflow_id: number | null;
  workflow_name: string | null;
  created_at?: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

interface RecruitmentWorkflow {
  id: number;
  name: string;
  is_active: boolean;
}

const emptyForm = {
  title: "",
  department: "",
  description: "",
  requirements: "",
  salary_range: "",
  employment_type: "",
  branch_id: "",
  workflow_id: "",
  status: "ACTIVE",
};

const JobPositionsPage = () => {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [workflows, setWorkflows] = useState<RecruitmentWorkflow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<JobPosition | null>(null);

  useEffect(() => {
    fetchPositions();
    getActiveBranches().then(setBranches).catch(() => {});
    getRecruitmentWorkflows().then((res) => setWorkflows(res.data || [])).catch(() => {});
  }, [page, pageSize, search, statusFilter]);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const result = await getJobPositions(page, Number(pageSize), search, statusFilter);
      setPositions(result.data);
      setTotal(result.pagination.total);
    } catch (err: any) {
      toast.error(err.message || "Failed to load job positions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const handleOpenEdit = (pos: JobPosition) => {
    setEditId(pos.id);
    setForm({
      title: pos.title,
      department: pos.department || "",
      description: pos.description || "",
      requirements: pos.requirements || "",
      salary_range: pos.salary_range || "",
      employment_type: pos.employment_type || "",
      branch_id: pos.branch_id ? String(pos.branch_id) : "",
      workflow_id: pos.workflow_id ? String(pos.workflow_id) : "",
      status: pos.status,
    });
    setDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    try {
      setSaving(true);
      if (editId) {
        await updateJobPosition(editId, form);
        toast.success("Job position updated");
      } else {
        await createJobPosition(form);
        toast.success("Job position created");
      }
      setDialogOpen(false);
      fetchPositions();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (pos: JobPosition) => {
    const newStatus = pos.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
    try {
      await updateJobPosition(pos.id, { ...pos, status: newStatus });
      toast.success(`Position ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`);
      fetchPositions();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await deleteJobPosition(deleteTarget.id);
      toast.success("Job position deleted");
      setDeleteTarget(null);
      fetchPositions();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    return (
      <Badge className={getStatusBadgeClassByStatus(status)}>{status}</Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">Job Positions</h1>
          <p className="text-sm text-muted-foreground">Manage open positions and job postings</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search positions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-64"
            />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Position
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader message="Loading job positions..." />
          ) : positions.length === 0 ? (
            <EmptyState message="No job positions found." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Employment Type</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((pos) => (
                    <TableRow key={pos.id}>
                      <TableCell className="font-medium">{pos.title}</TableCell>
                      <TableCell>{pos.department || "-"}</TableCell>
                      <TableCell>{pos.employment_type || "-"}</TableCell>
                      <TableCell>{pos.branch_name || "-"}</TableCell>
                      <TableCell>{pos.workflow_name || "-"}</TableCell>
                      <TableCell>{pos.salary_range || "-"}</TableCell>
                      <TableCell>{statusBadge(pos.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pos.created_at ? formatDate(pos.created_at) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => handleOpenEdit(pos)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            title={pos.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            onClick={() => handleToggleStatus(pos)}
                          >
                            {pos.status === "ACTIVE" ? (
                              <XCircle className="h-4 w-4 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" title="Delete" onClick={() => setDeleteTarget(pos)}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Position" : "Add Position"}</DialogTitle>
            <DialogDescription>
              {editId ? "Update the job position details below." : "Fill in the details for the new job position."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input name="title" value={form.title} onChange={handleChange} placeholder="e.g., Software Engineer" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Department</Label>
                <Input name="department" value={form.department} onChange={handleChange} placeholder="e.g., IT" />
              </div>
              <div className="space-y-1">
                <Label>Salary Range</Label>
                <Input name="salary_range" value={form.salary_range} onChange={handleChange} placeholder="e.g., 30k-50k" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Employment Type</Label>
                <Select
                  value={form.employment_type}
                  onValueChange={(v) => handleSelectChange("employment_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Probationary">Probationary</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Branch</Label>
                <Select
                  value={form.branch_id}
                  onValueChange={(v) => handleSelectChange("branch_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name} ({b.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Recruitment Workflow</Label>
                <Select
                  value={form.workflow_id}
                  onValueChange={(v) => handleSelectChange("workflow_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default (no workflow)" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea name="description" value={form.description} onChange={handleChange} placeholder="Job description" />
            </div>
            <div className="space-y-1">
              <Label>Requirements</Label>
              <Textarea name="requirements" value={form.requirements} onChange={handleChange} placeholder="Job requirements" />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => handleSelectChange("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? "Save Changes" : "Create Position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Position</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This action cannot be undone.
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
    </div>
  );
};

export default JobPositionsPage;
