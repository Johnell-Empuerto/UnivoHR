"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import {
  useSssTable, usePhilHealthTable, usePagIbigTable, useWithholdingTaxTable,
  useSssMutations, usePhilHealthMutations, usePagIbigMutations, useTaxMutations,
} from "../hooks/useContributionTables";
import { formatCurrency } from "@/utils/formatCurrency";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

type SssRow = { id: number; salary_from: number; salary_to: number; employer_share: number; employee_share: number; total_contribution: number };
type PhilHealthRow = { id: number; salary_from: number; salary_to: number; employee_rate: number; employer_rate: number; monthly_premium: number };
type PagIbigRow = { id: number; salary_from: number; salary_to: number; employee_share: number; employer_share: number };
type TaxRow = { id: number; salary_from: number; salary_to: number; tax_base: number; percentage_over_base: number; exempt_amount: number };

type TableKind = "sss" | "philhealth" | "pagibig" | "tax";

interface FormFields {
  salary_from: string;
  salary_to: string;
  [key: string]: string;
}

const initialForm = (kind: TableKind): FormFields => {
  if (kind === "sss") return { salary_from: "", salary_to: "", employer_share: "", employee_share: "", total_contribution: "" };
  if (kind === "philhealth") return { salary_from: "", salary_to: "", employee_rate: "", employer_rate: "", monthly_premium: "" };
  if (kind === "pagibig") return { salary_from: "", salary_to: "", employee_share: "", employer_share: "" };
  return { salary_from: "", salary_to: "", tax_base: "", percentage_over_base: "", exempt_amount: "0" };
};

const labels: Record<string, string> = {
  salary_from: "Salary From",
  salary_to: "Salary To",
  employer_share: "Employer Share",
  employee_share: "Employee Share",
  total_contribution: "Total Contribution",
  employee_rate: "Employee Rate (%)",
  employer_rate: "Employer Rate (%)",
  monthly_premium: "Monthly Premium",
  tax_base: "Tax Base",
  percentage_over_base: "% Over Base",
  exempt_amount: "Exempt Amount",
};

const numberField = (v: string) => (v === "" ? 0 : Number(v));

const ContributionTablesPanel = () => {
  const [tab, setTab] = useState<TableKind>("sss");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormFields>(initialForm("sss"));

  const { data: sssData = [], isLoading: sssLoading } = useSssTable();
  const { data: philHealthData = [], isLoading: philHealthLoading } = usePhilHealthTable();
  const { data: pagIbigData = [], isLoading: pagIbigLoading } = usePagIbigTable();
  const { data: taxData = [], isLoading: taxLoading } = useWithholdingTaxTable();

  const sssM = useSssMutations();
  const philM = usePhilHealthMutations();
  const pagM = usePagIbigMutations();
  const taxM = useTaxMutations();

  const openAdd = () => {
    setEditingId(null);
    setForm(initialForm(tab));
    setDialogOpen(true);
  };

  const openEdit = (row: any) => {
    setEditingId(row.id);
    const base = initialForm(tab);
    const f: FormFields = { ...base };
    for (const key of Object.keys(base)) {
      f[key] = String(row[key] ?? 0);
    }
    setForm(f);
    setDialogOpen(true);
  };

  const openDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleField = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const from = Number(form.salary_from);
    const to = Number(form.salary_to);
    if (from >= to) {
      toast.error("Salary From must be less than Salary To");
      return false;
    }
    return true;
  };

  const mutationSet: Record<string, typeof sssM> = { sss: sssM, philhealth: philM, pagibig: pagM, tax: taxM };
  const mut = mutationSet[tab];

  const handleSave = async () => {
    if (!validate()) return;
    const payload: Record<string, unknown> = {};
    for (const key of Object.keys(form)) {
      payload[key] = numberField(form[key]);
    }

    try {
      if (editingId) {
        await (mut.update as any).mutateAsync({ id: editingId, data: payload });
        toast.success("Row updated");
      } else {
        await (mut.create as any).mutateAsync(payload);
        toast.success("Row created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save row");
    }
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    try {
      await (mut.remove as any).mutateAsync(deletingId);
      toast.success("Row deleted");
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete row");
    }
  };

  const renderLoader = () => (
    <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  );

  const renderEmpty = () => (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">No data available</div>
  );

  const actionHeader = <TableHead className="w-[100px]">Actions</TableHead>;
  const actionCell = (row: { id: number }) => (
    <TableCell>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => openDelete(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    </TableCell>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Government Contribution Tables</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as TableKind)}>
          <TabsList>
            <TabsTrigger value="sss">SSS</TabsTrigger>
            <TabsTrigger value="philhealth">PhilHealth</TabsTrigger>
            <TabsTrigger value="pagibig">Pag-IBIG</TabsTrigger>
            <TabsTrigger value="tax">BIR Tax</TabsTrigger>
          </TabsList>

          <div className="flex justify-end mt-2 mb-2">
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Row</Button>
          </div>

          <TabsContent value="sss">
            {sssLoading ? renderLoader() : sssData.length === 0 ? renderEmpty() : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salary From</TableHead><TableHead>Salary To</TableHead>
                    <TableHead>Employer Share</TableHead><TableHead>Employee Share</TableHead>
                    <TableHead>Total Contribution</TableHead>
                    {actionHeader}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sssData.map((row: SssRow, i: number) => (
                    <TableRow key={row.id ?? i}>
                      <TableCell>₱{formatCurrency(row.salary_from)}</TableCell>
                      <TableCell>₱{formatCurrency(row.salary_to)}</TableCell>
                      <TableCell>₱{formatCurrency(row.employer_share)}</TableCell>
                      <TableCell>₱{formatCurrency(row.employee_share)}</TableCell>
                      <TableCell>₱{formatCurrency(row.total_contribution)}</TableCell>
                      {actionCell(row)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="philhealth">
            {philHealthLoading ? renderLoader() : philHealthData.length === 0 ? renderEmpty() : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salary From</TableHead><TableHead>Salary To</TableHead>
                    <TableHead>Employee Rate (%)</TableHead><TableHead>Employer Rate (%)</TableHead>
                    <TableHead>Monthly Premium</TableHead>
                    {actionHeader}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {philHealthData.map((row: PhilHealthRow, i: number) => (
                    <TableRow key={row.id ?? i}>
                      <TableCell>₱{formatCurrency(row.salary_from)}</TableCell>
                      <TableCell>₱{formatCurrency(row.salary_to)}</TableCell>
                      <TableCell>{row.employee_rate}%</TableCell>
                      <TableCell>{row.employer_rate}%</TableCell>
                      <TableCell>₱{formatCurrency(row.monthly_premium)}</TableCell>
                      {actionCell(row)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="pagibig">
            {pagIbigLoading ? renderLoader() : pagIbigData.length === 0 ? renderEmpty() : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salary From</TableHead><TableHead>Salary To</TableHead>
                    <TableHead>Employee Share (%)</TableHead><TableHead>Employer Share (%)</TableHead>
                    {actionHeader}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagIbigData.map((row: PagIbigRow, i: number) => (
                    <TableRow key={row.id ?? i}>
                      <TableCell>₱{formatCurrency(row.salary_from)}</TableCell>
                      <TableCell>₱{formatCurrency(row.salary_to)}</TableCell>
                      <TableCell>{row.employee_share}%</TableCell>
                      <TableCell>{row.employer_share}%</TableCell>
                      {actionCell(row)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="tax">
            {taxLoading ? renderLoader() : taxData.length === 0 ? renderEmpty() : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salary From</TableHead><TableHead>Salary To</TableHead>
                    <TableHead>Tax Base</TableHead><TableHead>% Over Base</TableHead>
                    <TableHead>Exempt Amount</TableHead>
                    {actionHeader}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxData.map((row: TaxRow, i: number) => (
                    <TableRow key={row.id ?? i}>
                      <TableCell>₱{formatCurrency(row.salary_from)}</TableCell>
                      <TableCell>₱{formatCurrency(row.salary_to)}</TableCell>
                      <TableCell>₱{formatCurrency(row.tax_base)}</TableCell>
                      <TableCell>{row.percentage_over_base}%</TableCell>
                      <TableCell>₱{formatCurrency(row.exempt_amount)}</TableCell>
                      {actionCell(row)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} {tab === "sss" ? "SSS" : tab === "philhealth" ? "PhilHealth" : tab === "pagibig" ? "Pag-IBIG" : "BIR Tax"} Row</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {Object.keys(initialForm(tab)).map((key) => (
                <div key={key} className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium">{labels[key] ?? key}</label>
                  <Input
                    className="col-span-3"
                    type="number"
                    step="any"
                    value={form[key]}
                    onChange={(e) => handleField(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this row?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this bracket entry. Government contribution
                calculations will use the remaining brackets. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default ContributionTablesPanel;
