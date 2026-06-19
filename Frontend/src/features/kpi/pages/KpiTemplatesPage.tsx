import { useState, useEffect } from "react";
import {
  getKpiTemplates, createKpiTemplate, updateKpiTemplate, deleteKpiTemplate, toggleKpiTemplate,
  getKpiTemplateItems, addKpiTemplateItem, updateKpiTemplateItem, deleteKpiTemplateItem,
} from "@/services/kpiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { FileText, Plus, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2, ToggleLeft, ToggleRight, Search, X } from "lucide-react";
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
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const activeFilterCount = [search].filter(Boolean).length;

  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handleClearFilters = () => {
    setSearch("");
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
  const [form, setForm] = useState({ ...emptyTemplateForm });
  const [saving, setSaving] = useState(false);

  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({ ...emptyItemForm });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [deleteItemTargetId, setDeleteItemTargetId] = useState<number | null>(null);
  const [deleteItemTargetName, setDeleteItemTargetName] = useState("");

  useEffect(() => { fetchTemplates(); }, [page, pageSize, search]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const result = await getKpiTemplates(page, pageSize, search);
      setTemplates(result.data);
      setTotal(result.pagination.total);
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
    try { await deleteKpiTemplate(id); toast.success("Template deleted"); fetchTemplates(); }
    catch (err: any) { toast.error(err.message || "Delete failed"); }
    setDeleteDialogOpen(false);
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
    if (isNaN(Number(itemForm.weight)) || Number(itemForm.weight) < 0) { toast.error("Weight must be a non-negative number"); return; }
    if (Number(itemForm.weight) > 100) { toast.error("Individual item weight cannot exceed 100"); return; }
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
    try {
      await deleteKpiTemplateItem(itemId);
      toast.success("Item deleted");
      if (selectedTemplate) {
        const data = await getKpiTemplateItems(selectedTemplate.id);
        setItems(data);
      }
    } catch (err: any) { toast.error(err.message || "Delete failed"); }
    setDeleteItemDialogOpen(false);
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
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search templates..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8" />
              {activeFilterCount > 0 && (
                <Button variant="ghost" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
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
                      <TableCell><Badge className={t.is_active ? getStatusBadgeClass("success") : getStatusBadgeClass("neutral")}>{t.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon-sm" title="Manage Items" onClick={() => handleOpenItems(t)}><FileText className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon-sm" title="Toggle Active" onClick={() => handleToggle(t.id)}>{t.is_active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}</Button>
                          <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => handleOpenEdit(t)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => { setDeleteTargetId(t.id); setDeleteTargetName(t.name); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
                <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}>
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
          <DialogHeader><DialogTitle>{editId ? "Edit Template" : "Add Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Production Operator KPI" />
            </div>
            <div className="space-y-1">
              <Label>Department</Label>
              <Input name="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g., Production" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[60px]" />
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
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEditItem(item)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => { setDeleteItemTargetId(item.id); setDeleteItemTargetName(item.kpi_name); setDeleteItemDialogOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
            <div className="space-y-1">
              <Label>KPI Name <span className="text-red-500">*</span></Label>
              <Input value={itemForm.kpi_name} onChange={(e) => setItemForm({ ...itemForm, kpi_name: e.target.value })} placeholder="e.g., Attendance" />
            </div>
            <div className="space-y-1">
              <Label>Weight (%)</Label>
              <Input type="number" value={itemForm.weight} onChange={(e) => setItemForm({ ...itemForm, weight: Number(e.target.value) })} min={0} max={100} step="0.01" />
              {itemForm.weight > 0 && itemForm.weight > 100 && <p className="text-xs text-red-500">Weight cannot exceed 100</p>}
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editItemId ? "Save Changes" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will also delete all associated items.
              Deleting <strong>{deleteTargetName}</strong> cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTargetId && handleDelete(deleteTargetId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteItemDialogOpen} onOpenChange={setDeleteItemDialogOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete KPI Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteItemTargetName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteItemTargetId && handleDeleteItem(deleteItemTargetId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KpiTemplatesPage;
