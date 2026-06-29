"use client";

import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2, Plus, Search, Edit, ToggleLeft, ToggleRight, Trash2, RefreshCw,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/shared/EmptyState";
import { useQueryClient } from "@tanstack/react-query";
import { useAllLeaveTypesAdmin } from "@/hooks/useLeaveTypes";
import {
  createLeaveType, updateLeaveTypeAdmin,
  toggleLeaveTypeEnabled, deleteLeaveType,
} from "@/services/leaveService";

interface LeaveType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  is_paid: boolean;
  is_convertible: boolean;
  max_convertible_days: number | null;
  requires_balance: boolean;
  default_days: number;
  requires_attachment: boolean;
  requires_approval: boolean;
  employee_requestable: boolean;
  hr_only: boolean;
  include_in_credits: boolean;
  is_unlimited: boolean;
  affects_payroll: boolean;
  deducts_salary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface LeaveTypeForm {
  code: string;
  name: string;
  description: string;
  is_enabled: boolean;
  is_paid: boolean;
  is_convertible: boolean;
  max_convertible_days: string;
  requires_balance: boolean;
  default_days: string;
  requires_attachment: boolean;
  requires_approval: boolean;
  employee_requestable: boolean;
  hr_only: boolean;
  include_in_credits: boolean;
  is_unlimited: boolean;
  affects_payroll: boolean;
  deducts_salary: boolean;
  sort_order: string;
}

const emptyForm: LeaveTypeForm = {
  code: "",
  name: "",
  description: "",
  is_enabled: false,
  is_paid: true,
  is_convertible: false,
  max_convertible_days: "",
  requires_balance: true,
  default_days: "0",
  requires_attachment: false,
  requires_approval: true,
  employee_requestable: true,
  hr_only: false,
  include_in_credits: true,
  is_unlimited: false,
  affects_payroll: true,
  deducts_salary: true,
  sort_order: "99",
};

const LeaveTypeSettings = () => {
  const queryClient = useQueryClient();
  const {
    data: leaveTypesData,
    isPending,
    isFetching,
    refetch,
  } = useAllLeaveTypesAdmin();
  const leaveTypes: LeaveType[] = leaveTypesData ?? [];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [formData, setFormData] = useState<LeaveTypeForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<LeaveType | null>(null);

  const filtered = leaveTypes.filter((lt) => {
    if (filter === "enabled" && !lt.is_enabled) return false;
    if (filter === "disabled" && lt.is_enabled) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!lt.code.toLowerCase().includes(q) && !lt.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openAdd = () => {
    setEditing(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (lt: LeaveType) => {
    setEditing(lt);
    setFormData({
      code: lt.code,
      name: lt.name,
      description: lt.description || "",
      is_enabled: lt.is_enabled,
      is_paid: lt.is_paid,
      is_convertible: lt.is_convertible,
      max_convertible_days: lt.max_convertible_days?.toString() || "",
      requires_balance: lt.requires_balance,
      default_days: lt.default_days.toString(),
      requires_attachment: lt.requires_attachment,
      requires_approval: lt.requires_approval,
      employee_requestable: lt.employee_requestable,
      hr_only: lt.hr_only,
      include_in_credits: lt.include_in_credits,
      is_unlimited: lt.is_unlimited,
      affects_payroll: lt.affects_payroll,
      deducts_salary: lt.deducts_salary,
      sort_order: lt.sort_order.toString(),
    });
    setDialogOpen(true);
  };

  const handleToggle = async (id: number) => {
    try {
      setToggling(id);
      const updated = await toggleLeaveTypeEnabled(id);
      queryClient.setQueryData(["leave-types", "all"], (prev: any) =>
        prev?.map((lt: any) => (lt.id === id ? { ...lt, is_enabled: updated.is_enabled } : lt))
      );
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      queryClient.invalidateQueries({ queryKey: ["leave-conversion", "types"] });
      toast.success(`Leave type ${updated.is_enabled ? "enabled" : "disabled"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle leave type");
    } finally {
      setToggling(null);
    }
  };

  const handleSave = async () => {
    if (!formData.code.trim()) { toast.error("Code is required"); return; }
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    const codeMatch = /^[A-Z][A-Z_ -]*[A-Z]$/.test(formData.code.trim());
    if (!codeMatch) { toast.error("Code must be uppercase letters, underscores, or spaces"); return; }

    try {
      setSaving(true);
      const payload: any = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description || null,
        is_enabled: formData.is_enabled,
        is_paid: formData.is_paid,
        is_convertible: formData.is_convertible,
        max_convertible_days: formData.max_convertible_days ? parseInt(formData.max_convertible_days) : null,
        requires_balance: formData.requires_balance,
        default_days: parseInt(formData.default_days) || 0,
        requires_attachment: formData.requires_attachment,
        requires_approval: formData.requires_approval,
        employee_requestable: formData.employee_requestable,
        hr_only: formData.hr_only,
        include_in_credits: formData.include_in_credits,
        is_unlimited: formData.is_unlimited,
        affects_payroll: formData.affects_payroll,
        deducts_salary: formData.deducts_salary,
        sort_order: parseInt(formData.sort_order) || 99,
      };
      if (editing) {
        const updated = await updateLeaveTypeAdmin(editing.id, payload);
        queryClient.setQueryData(["leave-types", "all"], (prev: any) =>
          prev?.map((lt: any) => (lt.id === editing.id ? updated : lt))
        );
        queryClient.invalidateQueries({ queryKey: ["leave-types"] });
        queryClient.invalidateQueries({ queryKey: ["leave-conversion", "types"] });
        toast.success("Leave type updated");
      } else {
        const created = await createLeaveType(payload);
        queryClient.setQueryData(["leave-types", "all"], (prev: any) => [...(prev || []), created]);
        queryClient.invalidateQueries({ queryKey: ["leave-types"] });
        queryClient.invalidateQueries({ queryKey: ["leave-conversion", "types"] });
        toast.success("Leave type created");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to save leave type");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lt: LeaveType) => {
    setDeleteConfirm(lt);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteLeaveType(deleteConfirm.id);
      queryClient.setQueryData(["leave-types", "all"], (prev: any) =>
        prev?.filter((t: any) => t.id !== deleteConfirm.id)
      );
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      queryClient.invalidateQueries({ queryKey: ["leave-conversion", "types"] });
      toast.success(`Leave type '${deleteConfirm.code}' deleted`);
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete leave type");
    }
  };

  const updateField = (field: keyof LeaveTypeForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Leave Types
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure leave types available for requests, credits, payroll behavior, and conversion.
          </p>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-37.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => refetch()} variant="ghost" disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Leave Type
            </Button>
          </div>

          {/* Table */}
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState message={search || filter !== "all" ? "No matching leave types" : "No leave types configured"} />
          ) : (
            <div className="rounded-md border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Default Days</TableHead>
                    <TableHead className="text-center">Paid</TableHead>
                    <TableHead className="text-center">Convertible</TableHead>
                    <TableHead className="text-center">Req. Balance</TableHead>
                    <TableHead className="text-center">Employee Req.</TableHead>
                    <TableHead className="text-center">In Credits</TableHead>
                    <TableHead className="text-right">Sort</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lt) => (
                    <TableRow key={lt.id} className={!lt.is_enabled ? "opacity-60" : ""}>
                      <TableCell className="font-mono font-medium">{lt.code}</TableCell>
                      <TableCell>{lt.name}</TableCell>
                      <TableCell>
                        <Badge variant={lt.is_enabled ? "default" : "secondary"} className={lt.is_enabled ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}>
                          {lt.is_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{lt.default_days}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={lt.is_paid ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" : "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"}>
                          {lt.is_paid ? "Paid" : "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {lt.is_convertible ? (
                          <span className="text-sm">{lt.max_convertible_days ?? "∞"} days</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {lt.requires_balance ? <span className="text-green-600 dark:text-green-400 font-medium">Yes</span> : <span className="text-muted-foreground">No</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {lt.employee_requestable ? <span className="text-green-600 dark:text-green-400 font-medium">Yes</span> : <span className="text-muted-foreground">No</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {lt.include_in_credits ? <span className="text-green-600 dark:text-green-400 font-medium">Yes</span> : <span className="text-muted-foreground">No</span>}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{lt.sort_order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(lt)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(lt.id)}
                            disabled={toggling === lt.id}
                            title={lt.is_enabled ? "Disable" : "Enable"}
                          >
                            {toggling === lt.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : lt.is_enabled ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lt)}
                            title="Delete permanently"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Leave Type" : "Add Leave Type"}</DialogTitle>
            <DialogDescription>
              {editing ? `Update configuration for ${editing.code}` : "Create a new leave type"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Identity */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                    placeholder="e.g. CL"
                    disabled={!!editing}
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Compassionate Leave"
                    maxLength={50}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Default Days</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.default_days}
                    onChange={(e) => updateField("default_days", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => updateField("sort_order", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Behavior */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Behavior</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enabled</p>
                    <p className="text-sm text-muted-foreground">Available for use</p>
                  </div>
                  <Switch checked={formData.is_enabled} onCheckedChange={(v) => updateField("is_enabled", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Paid</p>
                    <p className="text-sm text-muted-foreground">Leave is paid</p>
                  </div>
                  <Switch checked={formData.is_paid} onCheckedChange={(v) => updateField("is_paid", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Convertible to Cash</p>
                    <p className="text-sm text-muted-foreground">Can be converted</p>
                  </div>
                  <Switch checked={formData.is_convertible} onCheckedChange={(v) => updateField("is_convertible", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Requires Balance</p>
                    <p className="text-sm text-muted-foreground">Check available credits</p>
                  </div>
                  <Switch checked={formData.requires_balance} onCheckedChange={(v) => updateField("requires_balance", v)} disabled={formData.is_unlimited} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Unlimited</p>
                    <p className="text-sm text-muted-foreground">No cap on days</p>
                  </div>
                  <Switch checked={formData.is_unlimited} onCheckedChange={(v) => updateField("is_unlimited", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Employee Requestable</p>
                    <p className="text-sm text-muted-foreground">Visible in Leave Request</p>
                  </div>
                  <Switch checked={formData.employee_requestable} onCheckedChange={(v) => updateField("employee_requestable", v)} />
                </div>
              </div>
            </div>

            {/* Payroll */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payroll</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Affects Payroll</p>
                    <p className="text-sm text-muted-foreground">Impacts payroll computation</p>
                  </div>
                  <Switch checked={formData.affects_payroll} onCheckedChange={(v) => updateField("affects_payroll", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Deducts Salary</p>
                    <p className="text-sm text-muted-foreground">Reduces salary (unpaid)</p>
                  </div>
                  <Switch checked={formData.deducts_salary} onCheckedChange={(v) => updateField("deducts_salary", v)} />
                </div>
              </div>
            </div>

            {/* Conversion */}
            {formData.is_convertible && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Conversion</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Convertible Days</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.max_convertible_days}
                      onChange={(e) => updateField("max_convertible_days", e.target.value)}
                      placeholder="Leave blank for unlimited"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Restrictions */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Restrictions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Requires Attachment</p>
                    <p className="text-sm text-muted-foreground">Requires supporting document</p>
                  </div>
                  <Switch checked={formData.requires_attachment} onCheckedChange={(v) => updateField("requires_attachment", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Requires Approval</p>
                    <p className="text-sm text-muted-foreground">Needs manager approval</p>
                  </div>
                  <Switch checked={formData.requires_approval} onCheckedChange={(v) => updateField("requires_approval", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">HR Only</p>
                    <p className="text-sm text-muted-foreground">Only HR can assign/request</p>
                  </div>
                  <Switch checked={formData.hr_only} onCheckedChange={(v) => updateField("hr_only", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Include in Leave Credits</p>
                    <p className="text-sm text-muted-foreground">Shows in credit totals</p>
                  </div>
                  <Switch checked={formData.include_in_credits} onCheckedChange={(v) => updateField("include_in_credits", v)} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save Changes" : "Create Leave Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Leave Type</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete "{deleteConfirm?.name}" ({deleteConfirm?.code})? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveTypeSettings;
