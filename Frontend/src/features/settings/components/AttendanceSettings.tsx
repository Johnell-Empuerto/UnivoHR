// components/settings/AttendanceSettings.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getAttendanceRules,
  createAttendanceRule,
  updateAttendanceRule,
  activateAttendanceRule,
  deleteAttendanceRule,
} from "@/services/attendanceService";
import { Button } from "@/components/ui/Button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, Trash2, CheckCircle, XCircle, Edit } from "lucide-react";

interface AttendanceRule {
  id: number;
  late_threshold: number;
  grace_period: number;
  max_work_hours: number;
  late_deduction_type: "FIXED" | "PER_MINUTE";
  late_deduction_value: number;
  late_deduction_enabled: boolean;
  is_active: boolean;
  created_at?: string;
}

const AttendanceSettings = () => {
  const [rules, setRules] = useState<AttendanceRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<{
    id: number;
    isActive: boolean;
  } | null>(null);
  const [ruleToEdit, setRuleToEdit] = useState<AttendanceRule | null>(null);

  const [form, setForm] = useState({
    late_threshold: 0,
    grace_period: 0,
    max_work_hours: 8,
    late_deduction_type: "FIXED" as "FIXED" | "PER_MINUTE",
    late_deduction_value: 50,
    late_deduction_enabled: true,
  });

  // LOAD RULES
  const fetchRules = async () => {
    try {
      const data = await getAttendanceRules();
      setRules(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance rules");
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // HANDLE INPUT
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]:
          name === "late_threshold" ||
          name === "grace_period" ||
          name === "max_work_hours" ||
          name === "late_deduction_value"
            ? parseFloat(value) || 0
            : value,
      }));
    }
  };

  // CREATE RULE
  const handleCreate = async () => {
    if (form.late_threshold < 0) {
      toast.error("Late threshold cannot be negative");
      return;
    }
    if (form.grace_period < 0) {
      toast.error("Grace period cannot be negative");
      return;
    }
    if (form.max_work_hours <= 0) {
      toast.error("Max work hours must be greater than 0");
      return;
    }
    if (form.late_deduction_value <= 0) {
      toast.error("Deduction value must be greater than 0");
      return;
    }

    try {
      setCreating(true);
      await createAttendanceRule(form);
      toast.success("Attendance rule created successfully");
      setForm({
        late_threshold: 0,
        grace_period: 0,
        max_work_hours: 8,
        late_deduction_type: "FIXED",
        late_deduction_value: 50,
        late_deduction_enabled: true,
      });
      fetchRules();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create rule");
    } finally {
      setCreating(false);
    }
  };

  // EDIT - Open dialog
  const handleEditClick = (rule: AttendanceRule) => {
    setRuleToEdit(rule);
    setForm({
      late_threshold: rule.late_threshold,
      grace_period: rule.grace_period,
      max_work_hours: rule.max_work_hours,
      late_deduction_type: rule.late_deduction_type,
      late_deduction_value: rule.late_deduction_value,
      late_deduction_enabled: rule.late_deduction_enabled,
    });
    setEditDialogOpen(true);
  };

  // Confirm update
  const handleUpdate = async () => {
    if (!ruleToEdit) return;

    if (form.late_threshold < 0) {
      toast.error("Late threshold cannot be negative");
      return;
    }
    if (form.grace_period < 0) {
      toast.error("Grace period cannot be negative");
      return;
    }
    if (form.max_work_hours <= 0) {
      toast.error("Max work hours must be greater than 0");
      return;
    }
    if (form.late_deduction_value <= 0) {
      toast.error("Deduction value must be greater than 0");
      return;
    }

    try {
      setUpdating(true);
      await updateAttendanceRule(ruleToEdit.id, form);
      toast.success("Attendance rule updated successfully");
      fetchRules();
      setEditDialogOpen(false);
      setRuleToEdit(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update rule");
    } finally {
      setUpdating(false);
    }
  };

  // ACTIVATE
  const handleActivate = async (id: number) => {
    try {
      setLoading(true);
      await activateAttendanceRule(id);
      toast.success("Rule activated successfully");
      fetchRules();
    } catch (err) {
      console.error(err);
      toast.error("Failed to activate rule");
    } finally {
      setLoading(false);
    }
  };

  // DELETE - Open dialog
  const handleDeleteClick = (id: number, isActive: boolean) => {
    if (isActive) {
      toast.error(
        "Cannot delete active rule. Please activate another rule first.",
      );
      return;
    }
    setRuleToDelete({ id, isActive });
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!ruleToDelete) return;

    try {
      setLoading(true);
      await deleteAttendanceRule(ruleToDelete.id);
      toast.success("Rule deleted successfully");
      fetchRules();
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete rule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Form Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Add New Attendance Rule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Late Threshold */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Late Threshold <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="late_threshold"
                value={form.late_threshold}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Minutes"
              />
              <p className="text-xs text-muted-foreground">
                Minutes after shift start before employee is marked late
              </p>
            </div>

            {/* Grace Period */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Grace Period <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="grace_period"
                value={form.grace_period}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Minutes"
              />
              <p className="text-xs text-muted-foreground">
                Allowed delay without penalty
              </p>
            </div>

            {/* Max Work Hours */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Max Work Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="max_work_hours"
                value={form.max_work_hours}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Hours"
                step="0.5"
              />
              <p className="text-xs text-muted-foreground">
                Used for salary computation per day
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold mb-4">
              Late Deduction Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Enable Deduction */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="late_deduction_enabled"
                  id="late_deduction_enabled"
                  checked={form.late_deduction_enabled}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="late_deduction_enabled"
                  className="text-sm font-medium"
                >
                  Enable Late Deduction
                </label>
              </div>

              {/* Deduction Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Deduction Type</label>
                <select
                  name="late_deduction_type"
                  value={form.late_deduction_type}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="FIXED">Fixed Amount (per late)</option>
                  <option value="PER_MINUTE">Per Minute Deduction</option>
                </select>
              </div>

              {/* Deduction Value */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Deduction Value</label>
                <input
                  type="number"
                  name="late_deduction_value"
                  value={form.late_deduction_value}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Amount"
                />
                <p className="text-xs text-muted-foreground">
                  {form.late_deduction_type === "FIXED"
                    ? "Amount deducted per late occurrence"
                    : "Amount deducted per minute late"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="min-w-30"
            >
              {creating ? "Creating..." : "Add Rule"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Attendance Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Late After (mins)</TableHead>
                  <TableHead>Grace Period (mins)</TableHead>
                  <TableHead>Max Work Hours</TableHead>
                  <TableHead>Deduction Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      No attendance rules found. Create your first rule above.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {rule.late_threshold} min
                      </TableCell>
                      <TableCell>{rule.grace_period} min</TableCell>
                      <TableCell>{rule.max_work_hours} hrs</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {rule.late_deduction_type === "FIXED"
                            ? "Fixed"
                            : "Per Minute"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.late_deduction_type === "FIXED"
                          ? `₱${rule.late_deduction_value.toLocaleString()}`
                          : `₱${rule.late_deduction_value.toLocaleString()}/min`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            rule.late_deduction_enabled
                              ? "default"
                              : "secondary"
                          }
                          className={
                            rule.late_deduction_enabled
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                          }
                        >
                          {rule.late_deduction_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.is_active ? "default" : "secondary"}
                          className={
                            rule.is_active
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                          }
                        >
                          {rule.is_active ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(rule)}
                            disabled={loading}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {!rule.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivate(rule.id)}
                              disabled={loading}
                              className="h-8 px-3 text-xs"
                            >
                              Activate
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteClick(rule.id, rule.is_active)
                            }
                            disabled={loading || rule.is_active}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Edit Attendance Rule</DialogTitle>
            <DialogDescription>
              Update the attendance rule configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Late Threshold <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="late_threshold"
                  value={form.late_threshold}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Minutes"
                />
                <p className="text-xs text-muted-foreground">
                  Minutes after shift start before employee is marked late
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Grace Period <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="grace_period"
                  value={form.grace_period}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Minutes"
                />
                <p className="text-xs text-muted-foreground">
                  Allowed delay without penalty
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Max Work Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="max_work_hours"
                value={form.max_work_hours}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Hours"
                step="0.5"
              />
              <p className="text-xs text-muted-foreground">
                Used for salary computation per day
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-4">
                Late Deduction Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="late_deduction_enabled"
                    id="edit_late_deduction_enabled"
                    checked={form.late_deduction_enabled}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor="edit_late_deduction_enabled"
                    className="text-sm font-medium"
                  >
                    Enable Late Deduction
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Deduction Type
                    </label>
                    <select
                      name="late_deduction_type"
                      value={form.late_deduction_type}
                      onChange={handleChange}
                      className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="FIXED">Fixed Amount (per late)</option>
                      <option value="PER_MINUTE">Per Minute Deduction</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Deduction Value
                    </label>
                    <input
                      type="number"
                      name="late_deduction_value"
                      value={form.late_deduction_value}
                      onChange={handleChange}
                      className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Amount"
                    />
                    <p className="text-xs text-muted-foreground">
                      {form.late_deduction_type === "FIXED"
                        ? "Amount deducted per late occurrence"
                        : "Amount deducted per minute late"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setRuleToEdit(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Delete Attendance Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance rule? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setRuleToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceSettings;
