"use client";

import { useEffect, useState, useCallback } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Repeat,
  Plus,
  Pencil,
  Trash2,
  Sun,
  Moon,
  Sunset,
  Clock,
} from "lucide-react";
import {
  getRotationPatterns,
  getRotationPattern,
  createRotationPattern,
  updateRotationPattern,
  deleteRotationPattern,
} from "@/services/rotationService";
import { getActiveShifts } from "@/services/shiftService";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import type {
  RotationPattern,
  RotationPatternStep,
} from "@/services/rotationService";
import type { Shift } from "@/services/shiftService";

const defaultForm = {
  name: "",
  description: "",
  cycle_days: 7,
  is_active: true,
};

const shiftIcons: Record<string, React.ReactNode> = {
  MORNING: <Sun className="h-3.5 w-3.5 text-amber-500" />,
  MID: <Sunset className="h-3.5 w-3.5 text-orange-500" />,
  NIGHT: <Moon className="h-3.5 w-3.5 text-blue-500" />,
  FLEXITIME: <Clock className="h-3.5 w-3.5 text-purple-500" />,
};

const RotationPatterns = () => {
  const [patterns, setPatterns] = useState<RotationPattern[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RotationPattern | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [steps, setSteps] = useState<RotationPatternStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RotationPattern | null>(
    null,
  );

  const fetchPatterns = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRotationPatterns();
      setPatterns(data);
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchShifts = async () => {
    try {
      const data = await getActiveShifts();
      setShifts(data);
    } catch {
      setShifts([]);
    }
  };

  useEffect(() => {
    fetchPatterns();
    fetchShifts();
  }, [fetchPatterns]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setSteps(
      Array.from({ length: 7 }, (_, i) => ({
        day_offset: i,
        shift_id: null,
        is_rest_day: false,
      })),
    );
    setDialogOpen(true);
  };

  const openEdit = async (p: RotationPattern) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      cycle_days: p.cycle_days,
      is_active: p.is_active,
    });
    try {
      const detail = await getRotationPattern(p.id);
      setSteps(detail.steps || []);
    } catch {
      setSteps([]);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Pattern name is required");
      return;
    }
    if (steps.length === 0) {
      toast.error("Add at least one step to the pattern");
      return;
    }
    const invalidStep = steps.findIndex(
      (s) => !s.is_rest_day && !s.shift_id,
    );
    if (invalidStep !== -1) {
      toast.error(`Day ${invalidStep + 1}: select a shift or mark as rest day`);
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        cycle_days: form.cycle_days,
        is_active: form.is_active,
        steps: steps.map((s) => ({
          day_offset: s.day_offset,
          shift_id: s.is_rest_day ? null : s.shift_id,
          is_rest_day: s.is_rest_day,
        })),
      };
      if (editing) {
        await updateRotationPattern(editing.id, payload);
        toast.success("Pattern updated");
      } else {
        await createRotationPattern(payload as any);
        toast.success("Pattern created");
      }
      setDialogOpen(false);
      fetchPatterns();
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRotationPattern(deleteTarget.id);
      toast.success("Pattern deleted");
      setDeleteTarget(null);
      fetchPatterns();
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    }
  };

  const updateStep = (index: number, updates: Partial<RotationPatternStep>) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    );
  };

  const addStep = () => {
    const nextOffset = steps.length;
    setSteps((prev) => [
      ...prev,
      { day_offset: nextOffset, shift_id: null, is_rest_day: false },
    ]);
    setForm((prev) => ({ ...prev, cycle_days: nextOffset + 1 }));
  };

  const removeStep = (index: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, day_offset: i })),
    );
    setForm((prev) => ({
      ...prev,
      cycle_days: Math.max(1, prev.cycle_days - 1),
    }));
  };

  const getStepBadge = (step: RotationPatternStep) => {
    if (step.is_rest_day)
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Rest
        </Badge>
      );
    const shift = shifts.find((s) => s.id === step.shift_id);
    if (!shift) return <Badge variant="secondary">—</Badge>;
    return (
      <Badge variant={shift.type === "NIGHT" ? "destructive" : "default"}>
        {shiftIcons[shift.type]}
        <span className="ml-1">{shift.name}</span>
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Rotation Patterns
          </CardTitle>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Pattern
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading rotation patterns...
            </div>
          ) : patterns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Repeat className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No rotation patterns yet.</p>
              <p className="text-sm mt-1">
                Define the repeating shift sequence, such as Morning → Night →
                Rest.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Cycle Length</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patterns.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.cycle_days} days</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.steps_count ?? 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "default" : "secondary"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-5xl!">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Rotation Pattern" : "Create Rotation Pattern"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Pattern Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 7-Day Rotation"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  Cycle: <strong>{steps.length}</strong> day(s)
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Shift Sequence</Label>
                  <Button variant="outline" size="sm" onClick={addStep}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Day
                  </Button>
                </div>
                <div className="border rounded-md divide-y">
                  {steps.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No steps defined. Click "Add Day" to start building the
                      pattern.
                    </div>
                  ) : (
                    steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                          {step.day_offset + 1}
                        </div>
                        <div className="flex items-center gap-2 min-w-22.5">
                          {getStepBadge(step)}
                        </div>
                        <div className="flex items-center gap-2 min-w-25">
                          <Switch
                            checked={step.is_rest_day}
                            onCheckedChange={(v) => {
                              updateStep(index, {
                                is_rest_day: v,
                                shift_id: v ? null : step.shift_id,
                              });
                            }}
                            size="sm"
                          />
                          <Label className="text-xs">Rest Day</Label>
                        </div>
                        <div className="flex-1">
                          {!step.is_rest_day && (
                            <Select
                              value={step.shift_id?.toString() || ""}
                              onValueChange={(v) =>
                                updateStep(index, { shift_id: Number(v) })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select shift..." />
                              </SelectTrigger>
                              <SelectContent>
                                {shifts
                                  .filter((s) => s.is_active)
                                  .map((s) => (
                                    <SelectItem
                                      key={s.id}
                                      value={s.id.toString()}
                                    >
                                      <div className="flex items-center gap-2">
                                        {shiftIcons[s.type]}
                                        <span>{s.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {s.start_time.slice(0, 5)}-
                                          {s.end_time.slice(0, 5)}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStep(index)}
                          disabled={steps.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rotation Pattern</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This
              action cannot be undone. If groups are currently using this
              pattern, deletion will be blocked — set it to inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RotationPatterns;
