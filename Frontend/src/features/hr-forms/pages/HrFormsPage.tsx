import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHrForms, createHrForm, updateHrForm, deleteHrForm } from "@/services/hrFormService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Loader2, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, ClipboardList, ListChecks, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { formatDateShort } from "@/utils/formatDate";

interface HrForm { id: number; title: string; description: string | null; is_active: boolean; created_by_name: string; field_count: string; assignment_count: string; submission_count: string; created_at: string; updated_at: string; }

const statusBadge = (active: boolean) => {
  return active
    ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
    : <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Inactive</Badge>;
};

const HrFormsPage = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<HrForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [search, setSearch] = useState("");

  const totalPages = Math.ceil(total / Number(pageSize));
  const start = (page - 1) * Number(pageSize) + 1;
  const end = Math.min(page * Number(pageSize), total);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("..."); pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1); pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1); pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push("..."); pages.push(totalPages);
      }
    }
    return pages;
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchForms(); }, [page, pageSize, search]);

  const fetchForms = async () => {
    try { setLoading(true); const r = await getHrForms(page, Number(pageSize), search); setForms(r.data); setTotal(r.pagination.total); }
    catch { toast.error("Failed to load forms"); setForms([]); }
    finally { setLoading(false); }
  };

  const handleOpenCreate = () => { setEditId(null); setFormData({ title: "", description: "" }); setDialogOpen(true); };
  const handleOpenEdit = (f: HrForm) => {
    setEditId(f.id);
    setFormData({ title: f.title, description: f.description || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    try {
      setSaving(true);
      if (editId) { await updateHrForm(editId, formData); toast.success("Form updated"); }
      else { await createHrForm(formData); toast.success("Form created"); }
      setDialogOpen(false);
      fetchForms();
    } catch (err: any) { toast.error(err.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try { setDeleteLoading(true); await deleteHrForm(id); toast.success("Form deleted"); setDeleteDialog(null); fetchForms(); }
    catch (err: any) { toast.error(err.message || "Delete failed"); setDeleteDialog(null); }
    finally { setDeleteLoading(false); }
  };

  const handleToggleActive = async (f: HrForm) => {
    try { await updateHrForm(f.id, { is_active: !f.is_active }); toast.success(f.is_active ? "Form deactivated" : "Form activated"); fetchForms(); }
    catch (err: any) { toast.error(err.message || "Toggle failed"); }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">HR Forms</h1>
          <p className="text-sm text-muted-foreground">Create and manage dynamic forms</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Input placeholder="Search forms..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-64" />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/hr-forms/assignments")} variant="outline" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Assignments
            </Button>
            <Button onClick={() => navigate("/hr-forms/submissions")} variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Submissions
            </Button>
            <Button onClick={handleOpenCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Form
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader message="Loading forms..." />
          ) : forms.length === 0 ? (
            <EmptyState message="No forms found" description="Create your first form to get started." action={{ label: "Create Form", onClick: handleOpenCreate }} />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Assignments</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((f) => (
                    <TableRow key={f.id} className={!f.is_active ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{f.title}</TableCell>
                      <TableCell>{statusBadge(f.is_active)}</TableCell>
                      <TableCell>{f.field_count || 0}</TableCell>
                      <TableCell>{f.assignment_count || 0}</TableCell>
                      <TableCell>{f.submission_count || 0}</TableCell>
                      <TableCell>{f.created_by_name || "-"}</TableCell>
                      <TableCell className="text-sm">{formatDateShort(f.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon-sm" title="Manage Questions" onClick={() => navigate(`/hr-forms/${f.id}/builder`)}>
                            <ListChecks className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => handleOpenEdit(f)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title={f.is_active ? "Deactivate" : "Activate"} onClick={() => handleToggleActive(f)}>
                            {f.is_active ? <ToggleRight className="h-4 w-4 text-amber-500" /> : <ToggleLeft className="h-4 w-4 text-green-500" />}
                          </Button>
                          {Number(f.assignment_count) === 0 ? (
                            <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => setDeleteDialog(f.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon-sm" title="Has assignments — deactivate instead" disabled>
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {total > 0 && (
            <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select value={pageSize} onValueChange={(v) => { setPageSize(v); setPage(1); }}>
                  <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {start} to {end} of {total} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)}
                  disabled={page === 1} className="h-8 w-8 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getPageNumbers().map((p, i) => (
                  <Button key={i} variant={page === p ? "default" : "outline"} size="sm"
                    onClick={() => typeof p === "number" && goToPage(p)} disabled={p === "..."}
                    className={`h-8 w-8 p-0 ${p === "..." ? "cursor-default" : ""}`}>{p}</Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages} className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Form" : "Create Form"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Title <span className="text-red-500">*</span></p>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Employee Satisfaction Survey" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editId ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog !== null} onOpenChange={(o) => { if (!o) setDeleteDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this form and all its fields. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog !== null && handleDelete(deleteDialog)} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HrFormsPage;
