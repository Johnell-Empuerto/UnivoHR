import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHrForms, createHrForm, updateHrForm, deleteHrForm } from "@/services/hrFormService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Plus, Loader2, Pencil, Trash2, Eye, ClipboardList, ListChecks } from "lucide-react";
import { toast } from "sonner";

interface HrForm { id: number; title: string; description: string | null; is_active: boolean; created_by_name: string; field_count: string; }

const HrFormsPage = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<HrForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchForms(); }, [page, search]);

  const fetchForms = async () => {
    try { setLoading(true); const r = await getHrForms(page, 10, search); setForms(r.data); setTotal(r.total); }
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
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin mr-2" /><span>Loading...</span></div>
          ) : forms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No forms found.</div>
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
                          <button className="p-1 rounded hover:bg-muted" title="Manage Questions" onClick={() => navigate(`/hr-forms/${f.id}/builder`)}>
                            <ListChecks className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button className="p-1 rounded hover:bg-muted" title="Edit" onClick={() => handleOpenEdit(f)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button className="p-1 rounded hover:bg-muted" title="Delete" onClick={() => handleDelete(f.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
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
