import { useState, useEffect } from "react";
import {
  getKpiTemplates, createKpiTemplate, updateKpiTemplate, deleteKpiTemplate, toggleKpiTemplate,
  getKpiTemplateItems, addKpiTemplateItem, updateKpiTemplateItem, deleteKpiTemplateItem,
} from "@/services/kpiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { FileText, Plus, Loader2, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

interface Template { id: number; name: string; description: string | null; department: string | null; is_active: boolean; item_count: string; }
interface Item { id: number; template_id: number; kpi_name: string; description: string | null; weight: number; }

const emptyTemplateForm = { name: "", description: "", department: "" };
const emptyItemForm = { kpi_name: "", description: "", weight: 0 };

const KpiTemplatesPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyTemplateForm });
  const [saving, setSaving] = useState(false);

  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({ ...emptyItemForm });

  useEffect(() => { fetchTemplates(); }, [page, search]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const result = await getKpiTemplates(page, 10, search);
      setTemplates(result.data);
      setTotal(result.total);
    } catch (err: any) {
      toast.error(err.message || "Failed to load templates");
    } finally { setLoading(false); }
  };

  const handleOpenCreate = () => { setEditId(null); setForm({ ...emptyTemplateForm }); setDialogOpen(true); };
  const handleOpenEdit = (t: Template) => {
    setEditId(t.id);
    setForm({ name: t.name, description: t.description || "", department: t.department || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Template name is required"); return; }
    try {
      setSaving(true);
      if (editId) { await updateKpiTemplate(editId, form); toast.success("Template updated"); }
      else { await createKpiTemplate(form); toast.success("Template created"); }
      setDialogOpen(false);
      fetchTemplates();
    } catch (err: any) { toast.error(err.message || "Operation failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this template? This will also delete all associated items.")) return;
    try { await deleteKpiTemplate(id); toast.success("Template deleted"); fetchTemplates(); }
    catch (err: any) { toast.error(err.message || "Delete failed"); }
  };

  const handleToggle = async (id: number) => {
    try {
      const result = await toggleKpiTemplate(id);
      toast.success(result.is_active ? "Template activated" : "Template deactivated");
      fetchTemplates();
    } catch (err: any) { toast.error(err.message || "Toggle failed"); }
  };

  const handleOpenItems = async (t: Template) => {
    setSelectedTemplate(t);
    try {
      const data = await getKpiTemplateItems(t.id);
      setItems(data);
    } catch { setItems([]); }
    setItemsDialogOpen(true);
  };

  const handleOpenAddItem = () => { setEditItemId(null); setItemForm({ ...emptyItemForm }); setItemDialogOpen(true); };
  const handleOpenEditItem = (item: Item) => {
    setEditItemId(item.id);
    setItemForm({ kpi_name: item.kpi_name, description: item.description || "", weight: item.weight });
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.kpi_name.trim()) { toast.error("KPI name is required"); return; }
    if (!selectedTemplate) return;
    try {
      setSaving(true);
      if (editItemId) { await updateKpiTemplateItem(editItemId, itemForm); toast.success("Item updated"); }
      else { await addKpiTemplateItem(selectedTemplate.id, itemForm); toast.success("Item added"); }
      setItemDialogOpen(false);
      const data = await getKpiTemplateItems(selectedTemplate.id);
      setItems(data);
    } catch (err: any) { toast.error(err.message || "Operation failed"); }
    finally { setSaving(false); }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Delete this KPI item?")) return;
    try {
      await deleteKpiTemplateItem(itemId);
      toast.success("Item deleted");
      if (selectedTemplate) {
        const data = await getKpiTemplateItems(selectedTemplate.id);
        setItems(data);
      }
    } catch (err: any) { toast.error(err.message || "Delete failed"); }
  };

  const totalWeight = items.reduce((s, i) => s + Number(i.weight), 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">KPI Templates</h1>
          <p className="text-sm text-muted-foreground">Create and manage performance evaluation templates</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <input placeholder="Search templates..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border rounded px-3 py-1.5 text-sm bg-background w-64" />
          </div>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Template
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader message="Loading templates..." />
          ) : templates.length === 0 ? (
            <EmptyState message="No templates found." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.department || "-"}</TableCell>
                      <TableCell>{t.item_count || 0}</TableCell>
                      <TableCell><Badge className={t.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{t.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" title="Manage Items" onClick={() => handleOpenItems(t)}><FileText className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" title="Toggle Active" onClick={() => handleToggle(t.id)}>{t.is_active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}</Button>
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => handleOpenEdit(t)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" title="Delete" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>{editId ? "Edit Template" : "Add Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Name <span className="text-red-500">*</span></p>
              <input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" placeholder="e.g., Production Operator KPI" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Department</p>
              <input name="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" placeholder="e.g., Production" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editId ? "Save Changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>KPI Items - {selectedTemplate?.name}</DialogTitle></DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Total weight: <span className={`font-semibold ${totalWeight === 100 ? "text-green-600" : totalWeight > 100 ? "text-red-600" : "text-amber-600"}`}>{totalWeight}%</span> {totalWeight === 0 ? "" : totalWeight < 100 ? "(under 100%)" : totalWeight > 100 ? "(exceeds 100%!)" : "(balanced)"}</p>
            <Button size="sm" onClick={handleOpenAddItem}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
          </div>
          {items.length === 0 ? (
            <EmptyState message="No KPI items yet." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>KPI Name</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.kpi_name}{item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}</TableCell>
                      <TableCell>{item.weight}%</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEditItem(item)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editItemId ? "Edit KPI Item" : "Add KPI Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">KPI Name <span className="text-red-500">*</span></p>
              <input value={itemForm.kpi_name} onChange={(e) => setItemForm({ ...itemForm, kpi_name: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" placeholder="e.g., Attendance" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Weight (%)</p>
              <input type="number" value={itemForm.weight} onChange={(e) => setItemForm({ ...itemForm, weight: Number(e.target.value) })} className="w-full border rounded px-2 py-1 bg-background" min="0" max="100" step="0.01" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editItemId ? "Save Changes" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KpiTemplatesPage;
