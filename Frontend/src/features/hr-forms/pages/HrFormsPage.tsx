import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHrForms, createHrForm, updateHrForm, deleteHrForm } from "@/services/hrFormService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Loader2, Pencil, Trash2, Eye, ClipboardList, ListChecks, ToggleLeft, ToggleRight, Search, X } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { formatDateShort } from "@/utils/formatDate";

interface HrForm { id: number; title: string; description: string | null; is_active: boolean; created_by_name: string; field_count: string; assignment_count: string; submission_count: string; created_at: string; updated_at: string; }

const statusBadge = (active: boolean) => {
  return active
    ? <Badge className={getStatusBadgeClass("success")}>Active</Badge>
    : <Badge className={getStatusBadgeClass("neutral")}>Inactive</Badge>;
};

const HrFormsPage = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<HrForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [search, setSearch] = useState("");

  const activeFilterCount = [search].filter(Boolean).length;



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

  const handleClearFilters = () => {
    setSearch("");
    setPage(1);
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
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">HR Forms</h1>
          <p className="text-sm text-muted-foreground">Create and manage dynamic forms</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search forms..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9" />
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Form" : "Create Form"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Employee Satisfaction Survey" />
            </div>
            <div>
              <Label>Description</Label>
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
