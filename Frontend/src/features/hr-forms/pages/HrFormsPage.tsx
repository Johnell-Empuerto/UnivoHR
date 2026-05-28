import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHrForms, createHrForm, updateHrForm, deleteHrForm } from "@/services/hrFormService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Plus, Loader2, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, ClipboardList, ListChecks } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";

interface HrForm { id: number; title: string; description: string | null; is_active: boolean; created_by_name: string; field_count: string; }

const HrFormsPage = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<HrForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };
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

  useEffect(() => { fetchForms(); }, [page, pageSize, search]);

  const fetchForms = async () => {
      try { setLoading(true); const r = await getHrForms(page, pageSize, search); setForms(r.data); setTotal(r.pagination.total); }
    catch { setForms([]); }
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
    if (!confirm("Delete this form? All fields and submissions will be deleted.")) return;
    try { await deleteHrForm(id); toast.success("Form deleted"); fetchForms(); }
    catch (err: any) { toast.error(err.message || "Delete failed"); }
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
            <input placeholder="Search forms..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border rounded px-3 py-1.5 text-sm bg-background w-64" />
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
                    <TableHead>Fields</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.title}</TableCell>
                      <TableCell>{f.field_count || 0}</TableCell>
                      <TableCell>{f.created_by_name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon-sm" title="Manage Questions" onClick={() => navigate(`/hr-forms/${f.id}/builder`)}>
                            <ListChecks className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => handleOpenEdit(f)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => handleDelete(f.id)}>
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
          {total > 0 && (
            <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <select value={pageSize} onChange={handleRowsPerPageChange}
                  className="border rounded px-2 py-1 text-sm bg-background">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
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
              <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border rounded px-2 py-1 bg-background" placeholder="e.g., Employee Satisfaction Survey" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" />
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
    </div>
  );
};

export default HrFormsPage;
