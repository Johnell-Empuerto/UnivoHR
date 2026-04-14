// components/settings/PayRulesSettings.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getPayRules,
  createPayRule,
  updatePayRule,
  deletePayRule,
} from "@/services/payRuleService";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DollarSign, Edit, Trash2, Plus } from "lucide-react";

interface PayRule {
  id: number;
  day_type: string;
  multiplier: number;
  created_at?: string;
  updated_at?: string;
}

const PayRulesSettings = () => {
  const [payRules, setPayRules] = useState<PayRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PayRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    day_type: "REGULAR",
    multiplier: 1.0,
  });

  const dayTypeOptions = [
    { value: "REGULAR", label: "Regular Day" },
    { value: "SPECIAL_NON_WORKING", label: "Special Non-Working Day" },
    { value: "SPECIAL_HOLIDAY", label: "Special Holiday" },
    { value: "REGULAR_HOLIDAY", label: "Regular Holiday" },
  ];

  const getDayTypeLabel = (value: string) => {
    const option = dayTypeOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  // Load Pay Rules
  const fetchPayRules = async () => {
    try {
      const data = await getPayRules();
      setPayRules(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pay rules");
    }
  };

  useEffect(() => {
    fetchPayRules();
  }, []);

  // Handle Rule Form Input
  const handleRuleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setRuleForm((prev) => ({
      ...prev,
      [name]: name === "multiplier" ? parseFloat(value) || 0 : value,
    }));
  };

  // Create/Update Pay Rule
  const handleSaveRule = async () => {
    if (ruleForm.multiplier <= 0) {
      toast.error("Multiplier must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      if (editingRule) {
        await updatePayRule(editingRule.id, ruleForm);
        toast.success("Pay rule updated successfully");
      } else {
        await createPayRule(ruleForm);
        toast.success("Pay rule created successfully");
      }
      fetchPayRules();
      setRuleDialogOpen(false);
      setEditingRule(null);
      setRuleForm({ day_type: "REGULAR", multiplier: 1.0 });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save pay rule");
    } finally {
      setLoading(false);
    }
  };

  // Delete Pay Rule
  const handleDeleteRule = async (id: number) => {
    if (!confirm("Are you sure you want to delete this pay rule?")) return;

    try {
      setLoading(true);
      await deletePayRule(id);
      toast.success("Pay rule deleted successfully");
      fetchPayRules();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete pay rule");
    } finally {
      setLoading(false);
    }
  };

  // Edit Pay Rule
  const handleEditRule = (rule: PayRule) => {
    setEditingRule(rule);
    setRuleForm({
      day_type: rule.day_type,
      multiplier: rule.multiplier,
    });
    setRuleDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Pay Rules Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Pay Rate Multipliers
          </CardTitle>
          <Button
            onClick={() => {
              setEditingRule(null);
              setRuleForm({ day_type: "REGULAR", multiplier: 1.0 });
              setRuleDialogOpen(true);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Day Type</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payRules.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      No pay rules found. Create your first rule.
                    </TableCell>
                  </TableRow>
                ) : (
                  payRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {getDayTypeLabel(rule.day_type)}
                      </TableCell>
                      <TableCell>{rule.multiplier}x</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
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

      {/* Pay Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Pay Rule" : "Add Pay Rule"}
            </DialogTitle>
            <DialogDescription>
              Configure the pay multiplier for different day types.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Day Type</label>
              <select
                name="day_type"
                value={ruleForm.day_type}
                onChange={handleRuleChange}
                className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {dayTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Multiplier</label>
              <input
                type="number"
                name="multiplier"
                value={ruleForm.multiplier}
                onChange={handleRuleChange}
                step="0.01"
                min="0"
                className="w-full border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., 1.3"
              />
              <p className="text-xs text-muted-foreground">
                Multiply the daily rate by this factor
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayRulesSettings;
