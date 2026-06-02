"use client";

import { useEffect, useState } from "react";
import { getActiveBranches } from "@/services/branchService";
import {
  getAllBranchRestDays,
  getBranchRestDays,
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
import { Sun, Trash2, Plus } from "lucide-react";

interface Branch {
  id: number;
  name: string;
  code: string;
}

const BranchRestDays = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchRestDays, setBranchRestDays] = useState<BranchRestDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [b, r] = await Promise.all([getActiveBranches(), getAllBranchRestDays()]);
      setBranches(b);
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

  const filtered = branchFilter
    ? branchRestDays.filter((r) => r.branch_id === parseInt(branchFilter))
    : branchRestDays;

  const getBranchName = (branchId: number) =>
    branches.find((b) => b.id === branchId)?.name || `Branch #${branchId}`;

  const handleAdd = async () => {
    const sel = document.getElementById("branch-select") as HTMLSelectElement;
    const dowSel = document.getElementById("branch-dow-select") as HTMLSelectElement;
    const branchId = parseInt(sel?.value);
    const dow = parseInt(dowSel?.value);

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
      dowSel.value = "";
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
            <select
              id="branch-select"
              className="border rounded px-2 py-1.5 text-sm bg-background"
              defaultValue=""
            >
              <option value="" disabled>Select branch...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Rest Day</p>
            <select
              id="branch-dow-select"
              className="border rounded px-2 py-1.5 text-sm bg-background"
              defaultValue=""
            >
              <option value="" disabled>Select day...</option>
              {getAllDayLabels().map((label, idx) => (
                <option key={idx} value={idx}>{label}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleAdd} size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        <div className="flex gap-2">
          <select
            className="border rounded px-2 py-1 text-xs bg-background"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
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
