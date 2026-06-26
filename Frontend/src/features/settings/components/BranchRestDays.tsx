"use client";

import { useEffect, useState } from "react";
import { useActiveBranches } from "@/hooks/useBranches";
import {
  getAllBranchRestDays,
  createBranchRestDay,
  deleteBranchRestDay,
  getDayLabel,
  getAllDayLabels,
} from "@/services/restDayService";
import type { BranchRestDay } from "@/services/restDayService";
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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sun, Trash2, Plus } from "lucide-react";

const BranchRestDays = () => {
  const { data: branches = [] } = useActiveBranches();
  const [branchRestDays, setBranchRestDays] = useState<BranchRestDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await getAllBranchRestDays();
      setBranchRestDays(r);
    } catch {
      toast.error("Failed to load branch rest days");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = branchFilter && branchFilter !== "all"
    ? branchRestDays.filter((r) => r.branch_id === parseInt(branchFilter))
    : branchRestDays;

  const getBranchName = (branchId: number) =>
    branches.find((b: { id: number; name: string }) => b.id === branchId)
      ?.name || `Branch #${branchId}`;

  const handleAdd = async () => {
    const branchId = parseInt(selectedBranchId);
    const dow = parseInt(selectedDayOfWeek);

    if (isNaN(branchId) || isNaN(dow)) {
      toast.error("Select a branch and day");
      return;
    }

    if (branchRestDays.some((r) => r.branch_id === branchId && r.day_of_week === dow)) {
      toast.error("Rest day already configured for this branch");
      return;
    }

    try {
      const created = await createBranchRestDay(branchId, { day_of_week: dow });
      setBranchRestDays((prev) => [...prev, created]);
      setSelectedBranchId("");
      setSelectedDayOfWeek("");
      toast.success("Branch rest day added");
    } catch {
      toast.error("Failed to add");
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await deleteBranchRestDay(id);
      setBranchRestDays((prev) => prev.filter((r) => r.id !== id));
      toast.success("Branch rest day removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Branch Rest Days
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure default rest days per branch. Employees inherit their branch's rest days
          unless individual rest days are assigned.
        </p>

        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Branch</p>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select branch..." />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b: { id: number; name: string }) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Rest Day</p>
            <Select value={selectedDayOfWeek} onValueChange={setSelectedDayOfWeek}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select day..." />
              </SelectTrigger>
              <SelectContent>
                {getAllDayLabels().map((label, idx) => (
                  <SelectItem key={idx} value={String(idx)}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        <div className="flex gap-2">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b: { id: number; name: string }) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No branch rest days configured.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead>Rest Day</TableHead>
                <TableHead className="w-20">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{getBranchName(r.branch_id)}</TableCell>
                  <TableCell>{getDayLabel(r.day_of_week)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(r.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchRestDays;
