"use client";

import { useState } from "react";
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
import { Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createShift,
  updateShift,
  deleteShift,
} from "@/services/shiftService";
import type { Shift } from "@/services/shiftService";
import { useShifts } from "@/hooks/useShifts";

type ShiftType = "MORNING" | "MID" | "NIGHT" | "FLEXITIME";

const typeConfig: Record<ShiftType, { label: string; color: "default" | "secondary" | "destructive" | "outline" }> = {
  MORNING:   { label: "Morning",   color: "default" },
  MID:       { label: "Mid",       color: "secondary" },
  NIGHT:     { label: "Night",     color: "destructive" },
  FLEXITIME: { label: "Flexitime", color: "outline" },
};

const defaultForm = {
  name: "",
  code: "",
  type: "MORNING" as ShiftType,
  start_time: "08:00",
  end_time: "17:00",
  break_start: "12:00",
  break_end: "13:00",
  grace_minutes: 0,
  required_hours: 8,
  flex_start_window: "",
  flex_end_window: "",
  description: "",
  is_active: true,
};

const ShiftManagement = () => {
  const queryClient = useQueryClient();
  const { data: shifts = [], isLoading } = useShifts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingShift(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (shift: Shift) => {
    setEditingShift(shift);
    setForm({
      name: shift.name,
      code: shift.code || "",
      type: shift.type,
      start_time: shift.start_time.slice(0, 5),
      end_time: shift.end_time.slice(0, 5),
      break_start: shift.break_start ? shift.break_start.slice(0, 5) : "12:00",
      break_end: shift.break_end ? shift.break_end.slice(0, 5) : "13:00",
      grace_minutes: shift.grace_minutes,
      required_hours: shift.required_hours,
      flex_start_window: shift.flex_start_window ? shift.flex_start_window.slice(0, 5) : "",
      flex_end_window: shift.flex_end_window ? shift.flex_end_window.slice(0, 5) : "",
      description: shift.description || "",
      is_active: shift.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Shift name is required");
      return;
    }
    if (!form.start_time || !form.end_time) {
      toast.error("Start and end times are required");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        code: form.code.trim() || null,
        description: form.description.trim() || null,
        flex_start_window: form.flex_start_window || null,
        flex_end_window: form.flex_end_window || null,
        is_night_shift: form.type === "NIGHT",
        is_flexitime: form.type === "FLEXITIME",
      };
      if (editingShift) {
        await updateShift(editingShift.id, payload);
        toast.success("Shift updated");
      } else {
        await createShift(payload as any);
        toast.success("Shift created");
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    } catch {
      toast.error("Failed to save shift");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shift: Shift) => {
    if (!confirm(`Delete shift "${shift.name}"?`)) return;
    try {
      await deleteShift(shift.id);
      toast.success("Shift deleted");
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    } catch {
      toast.error("Failed to delete shift");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Shift Schedules
        </CardTitle>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Shift
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading shifts...</div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No shifts configured. Create your first shift schedule.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Break</TableHead>
                <TableHead>Grace</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{shift.code || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={typeConfig[shift.type]?.color || "default"}>
                      {typeConfig[shift.type]?.label || shift.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{shift.start_time.slice(0, 5)}</TableCell>
                  <TableCell>{shift.end_time.slice(0, 5)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {shift.break_start && shift.break_end
                      ? `${shift.break_start.slice(0, 5)}-${shift.break_end.slice(0, 5)}`
                      : "—"}
                  </TableCell>
                  <TableCell>{shift.grace_minutes}m</TableCell>
                  <TableCell>{shift.required_hours}h</TableCell>
                  <TableCell>
                    <Badge variant={shift.is_active ? "default" : "secondary"}>
                      {shift.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(shift)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(shift)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingShift ? "Edit Shift" : "Create Shift"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Shift Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Morning Shift"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. MORNING"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: ShiftType) =>
                    setForm({ ...form, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING">Morning</SelectItem>
                    <SelectItem value="MID">Mid</SelectItem>
                    <SelectItem value="NIGHT">Night</SelectItem>
                    <SelectItem value="FLEXITIME">Flexitime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Break Start</Label>
                <Input
                  type="time"
                  value={form.break_start}
                  onChange={(e) =>
                    setForm({ ...form, break_start: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Break End</Label>
                <Input
                  type="time"
                  value={form.break_end}
                  onChange={(e) =>
                    setForm({ ...form, break_end: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grace Minutes</Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={form.grace_minutes}
                  onChange={(e) =>
                    setForm({ ...form, grace_minutes: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Required Hours</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  step={0.5}
                  value={form.required_hours}
                  onChange={(e) =>
                    setForm({ ...form, required_hours: Number(e.target.value) || 8 })
                  }
                />
              </div>
            </div>

            {form.type === "FLEXITIME" && (
              <div className="grid grid-cols-2 gap-4 p-3 border rounded bg-muted/20">
                <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase -mb-1">
                  Flexitime Windows
                </p>
                <div className="space-y-2">
                  <Label>Flex Start Window</Label>
                  <Input
                    type="time"
                    value={form.flex_start_window}
                    onChange={(e) =>
                      setForm({ ...form, flex_start_window: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Flex End Window</Label>
                  <Input
                    type="time"
                    value={form.flex_end_window}
                    onChange={(e) =>
                      setForm({ ...form, flex_end_window: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

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
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingShift ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ShiftManagement;
