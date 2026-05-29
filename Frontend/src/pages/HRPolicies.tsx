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
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";
import { RichTextEditor } from "@/features/hr-policies/components/RichTextEditor";
import { PolicyViewer } from "@/features/hr-policies/components/PolicyViewer";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";

interface HrPolicy {
  id: number;
  title: string;
  category: string;
  content: string;
  content_format?: string;
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
  const isAdmin = user?.role === "SYSTEM_ADMIN" || user?.role === "ADMIN";

  const [policies, setPolicies] = useState<HrPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewPolicy, setViewPolicy] = useState<HrPolicy | null>(null);
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

  const handleOpenView = (policy: HrPolicy) => {
    setViewPolicy(policy);
    setViewDialogOpen(true);
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleContentChange = (html: string) => {
    setForm({ ...form, content: html });
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

  const activePolicies = policies.filter((p) => p.is_active);

  const filteredPolicies = (isAdmin ? policies : activePolicies).filter((p) => {
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

  if (!isAdmin) {
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
              View company policies and HR documents
            </p>
          </div>
        </div>

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
        </div>

        {loading ? (
          <Loader message="Loading policies..." />
        ) : filteredPolicies.length === 0 ? (
          <EmptyState message="No policies found" />
        ) : (
          <div className="grid gap-4">
            {filteredPolicies.map((policy) => (
              <Card
                key={policy.id}
                className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOpenView(policy)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`${
                            policy.category === "attendance"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : policy.category === "leave"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : policy.category === "overtime"
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                  : policy.category === "security"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    : policy.category === "payroll"
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                      : "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400"
                          }`}
                        >
                          {policy.category.charAt(0).toUpperCase() +
                            policy.category.slice(1)}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-base">
                        {policy.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {policy.content.replace(/<[^>]*>/g, "").trim()}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="sr-only">
                {viewPolicy?.title}
              </DialogTitle>
            </DialogHeader>
            {viewPolicy && (
              <PolicyViewer
                title={viewPolicy.title}
                category={viewPolicy.category}
                content={viewPolicy.content}
                updatedAt={viewPolicy.updated_at}
              />
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

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
          <Button
            onClick={handleOpenCreate}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Policy
          </Button>
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-2 bg-background text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <Loader message="Loading policies..." />
          ) : filteredPolicies.length === 0 ? (
            <EmptyState message="No policies found" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
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
                        {policy.content.replace(/<[^>]*>/g, "").trim()}
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            onClick={() => handleOpenEdit(policy)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={policy.is_active ? "Deactivate" : "Activate"}
                            onClick={() => handleToggleActive(policy)}
                          >
                            {policy.is_active ? (
                              <PowerOff className="h-4 w-4 text-red-500" />
                            ) : (
                              <Power className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            onClick={() => handleDeleteClick(policy)}
                          >
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Policy" : "Add Policy"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Title <span className="text-red-500">*</span>
                </p>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleTextChange}
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
                  onChange={handleTextChange}
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
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Content <span className="text-red-500">*</span>
              </p>
              <RichTextEditor
                content={form.content}
                onChange={handleContentChange}
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
            <strong>{deleteTarget?.title}</strong>? This action cannot be
            undone.
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
