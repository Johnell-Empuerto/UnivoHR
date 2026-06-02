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
import { toast } from "sonner";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import {
  getRotationAssignments,
  createRotationAssignment,
  deleteRotationAssignment,
  getRotationGroups,
  getRotationPatterns,
} from "@/services/rotationService";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { formatDate } from "@/utils/formatDate";
import type {
  GroupAssignment,
  RotationGroup,
  RotationPattern,
} from "@/services/rotationService";

const RotationAssignments = () => {
  const [assignments, setAssignments] = useState<GroupAssignment[]>([]);
  const [groups, setGroups] = useState<RotationGroup[]>([]);
  const [patterns, setPatterns] = useState<RotationPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GroupAssignment | null>(
    null,
  );

  const [formGroupId, setFormGroupId] = useState("");
  const [formPatternId, setFormPatternId] = useState("");
  const [formEffectiveDate, setFormEffectiveDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formEndDate, setFormEndDate] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [a, g, p] = await Promise.all([
        getRotationAssignments(),
        getRotationGroups(),
        getRotationPatterns(),
      ]);
      setAssignments(a);
      setGroups(g);
      setPatterns(p);
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setFormGroupId("");
    setFormPatternId("");
    setFormEffectiveDate(new Date().toISOString().split("T")[0]);
    setFormEndDate("");
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formGroupId || !formPatternId || !formEffectiveDate) {
      toast.error("Please select a group, pattern, and start date");
      return;
    }
    try {
      setSaving(true);
      await createRotationAssignment({
        group_id: Number(formGroupId),
        pattern_id: Number(formPatternId),
        effective_date: formEffectiveDate,
        end_date: formEndDate || null,
      } as any);
      toast.success("Pattern assigned to group");
      setDialogOpen(false);
      fetchAll();
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRotationAssignment(deleteTarget.id);
      toast.success("Assignment removed");
      setDeleteTarget(null);
      fetchAll();
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    }
  };

  const getGroupName = (id: number) =>
    groups.find((g) => g.id === id)?.name || `Group #${id}`;

  const getPatternName = (id: number) =>
    patterns.find((p) => p.id === id)?.name || `Pattern #${id}`;

  const isActive = (a: GroupAssignment) => {
    const today = new Date().toISOString().split("T")[0];
    return a.effective_date <= today && (!a.end_date || a.end_date >= today);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Pattern Assignments
          </CardTitle>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Assign Pattern
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No pattern assignments yet.</p>
              <p className="text-sm mt-1">
                Assign a rotation pattern to a group and set when it starts.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {getGroupName(a.group_id)}
                    </TableCell>
                    <TableCell>{getPatternName(a.pattern_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.cycle_days} days</Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDate(a.effective_date)}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {a.end_date ? formatDate(a.end_date) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive(a) ? "default" : "secondary"}>
                        {isActive(a) ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(a)}
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Pattern to Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Group</Label>
                <Select value={formGroupId} onValueChange={setFormGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groups
                      .filter((g) => g.is_active)
                      .map((g) => (
                        <SelectItem key={g.id} value={g.id.toString()}>
                          {g.name}
                          {g.code ? ` (${g.code})` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pattern</Label>
                <Select value={formPatternId} onValueChange={setFormPatternId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patterns
                      .filter((p) => p.is_active)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name} ({p.cycle_days} days)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formEffectiveDate}
                  onChange={(e) => setFormEffectiveDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Assigning..." : "Assign"}
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
            <AlertDialogTitle>Remove Pattern Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this assignment? The group "
              {deleteTarget?.group_name}" will stop using the pattern "
              {deleteTarget?.pattern_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RotationAssignments;
