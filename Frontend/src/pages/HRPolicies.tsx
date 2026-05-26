import { useState, useEffect } from "react";
import {
  getHrPolicies,
  createHrPolicy,
  updateHrPolicy,
  deleteHrPolicy,
  setHrPolicyStatus,
} from "@/services/hrPolicyService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";

interface HrPolicy {
  id: number;
  title: string;
  category: string;
  content: string;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  "attendance",
  "leave",
  "overtime",
  "security",
  "payroll",
  "privacy",
];

const emptyForm = {
  title: "",
  category: "",
  content: "",
};

const HRPolicies = () => {
  const { user } = useAuth();
  const isAdmin =
    user?.role === "ADMIN" || user?.role === "HR_ADMIN";

  const [policies, setPolicies] = useState<HrPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HrPolicy | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await getHrPolicies();
      setPolicies(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const handleOpenEdit = (policy: HrPolicy) => {
    setEditId(policy.id);
    setForm({
      title: policy.title,
      category: policy.category,
      content: policy.content,
    });
    setDialogOpen(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.category.trim()) {
      toast.error("Category is required");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Content is required");
      return;
    }

    try {
      setSaving(true);
      if (editId) {
        await updateHrPolicy(editId, form);
        toast.success("Policy updated");
      } else {
        await createHrPolicy(form);
        toast.success("Policy created");
      }
      setDialogOpen(false);
      fetchPolicies();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (policy: HrPolicy) => {
    try {
      const updated = await setHrPolicyStatus(policy.id, !policy.is_active);
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? updated : p)),
      );
      toast.success(
        updated.is_active ? "Policy activated" : "Policy deactivated",
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update policy status");
    }
  };

  const handleDeleteClick = (policy: HrPolicy) => {
    setDeleteTarget(policy);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await deleteHrPolicy(deleteTarget.id);
      toast.success("Policy deleted");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchPolicies();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete policy");
    } finally {
      setSaving(false);
    }
  };

  const filteredPolicies = policies.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !categoryFilter || p.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.is_active) ||
      (statusFilter === "inactive" && !p.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            HR Policies
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage company policies and HR documents
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>All Policies</CardTitle>
          {isAdmin && (
            <Button
              onClick={handleOpenCreate}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Policy
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search policies..."
                className="w-full border rounded pl-8 pr-3 py-2 bg-background text-sm"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded px-3 py-2 bg-background text-sm"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            {isAdmin && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-3 py-2 bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">
                Loading policies...
              </span>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No policies found.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">
                        {policy.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {policy.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {policy.content}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            policy.is_active ? "default" : "secondary"
                          }
                          className={
                            policy.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          }
                        >
                          {policy.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1 rounded hover:bg-muted transition"
                              title="Edit"
                              onClick={() => handleOpenEdit(policy)}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-muted transition"
                              title={
                                policy.is_active
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              onClick={() => handleToggleActive(policy)}
                            >
                              {policy.is_active ? (
                                <PowerOff className="h-4 w-4 text-red-500 hover:text-red-700" />
                              ) : (
                                <Power className="h-4 w-4 text-green-500 hover:text-green-700" />
                              )}
                            </button>
                            <button
                              className="p-1 rounded hover:bg-muted transition"
                              title="Delete"
                              onClick={() => handleDeleteClick(policy)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                            </button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Policy" : "Add Policy"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Title <span className="text-red-500">*</span>
              </p>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1 bg-background"
                placeholder="e.g., Attendance Policy"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Category <span className="text-red-500">*</span>
              </p>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1 bg-background"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Content <span className="text-red-500">*</span>
              </p>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={5}
                className="w-full border rounded px-2 py-1 bg-background resize-y"
                placeholder="Enter policy content..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? "Save Changes" : "Create Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Policy</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.title}</strong>? This will deactivate the
            policy.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={saving}
            >
              {saving && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRPolicies;
