import { useState, useEffect } from "react";
import {
  getJobPositions,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition,
} from "@/services/jobPositionService";
import { getActiveBranches } from "@/services/branchService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import {
  Briefcase, Plus, Loader2, Pencil, Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

const emptyForm = {
  title: "",
  department: "",
  description: "",
  requirements: "",
  salary_range: "",
  employment_type: "",
  branch_id: "",
  status: "ACTIVE",
};

const JobPositionsPage = () => {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    fetchPositions();
    getActiveBranches().then(setBranches).catch(() => {});
  }, [page, search, statusFilter]);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const result = await getJobPositions(page, 10, search, statusFilter);
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
      status: pos.status,
    });
    setDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this job position?")) return;
    try {
      await deleteJobPosition(id);
      toast.success("Job position deleted");
      fetchPositions();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      ON_HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
    return (
      <Badge className={map[status] || ""}>{status}</Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">Job Positions</h1>
          <p className="text-sm text-muted-foreground">Manage open positions and job postings</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              placeholder="Search positions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border rounded px-3 py-1.5 text-sm bg-background w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border rounded px-3 py-1.5 text-sm bg-background"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
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
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Status</TableHead>
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
                      <TableCell>{pos.salary_range || "-"}</TableCell>
                      <TableCell>{statusBadge(pos.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => handleOpenEdit(pos)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Delete" onClick={() => handleDelete(pos.id)}>
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
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>{total} total</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Position" : "Add Position"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Title <span className="text-red-500">*</span></p>
              <input name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background" placeholder="e.g., Software Engineer" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Department</p>
                <input name="department" value={form.department} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background" placeholder="e.g., IT" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Salary Range</p>
                <input name="salary_range" value={form.salary_range} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background" placeholder="e.g., 30k-50k" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Employment Type</p>
                <select name="employment_type" value={form.employment_type} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background">
                  <option value="">Select type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Probationary">Probationary</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Branch</p>
                <select name="branch_id" value={form.branch_id} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background">
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" placeholder="Job description" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Requirements</p>
              <textarea name="requirements" value={form.requirements} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" placeholder="Job requirements" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background">
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
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
    </div>
  );
};

export default JobPositionsPage;
