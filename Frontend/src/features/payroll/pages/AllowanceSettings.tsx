import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/shared/TablePagination";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, DollarSign, X } from "lucide-react";

import {
  createAllowanceType,
  updateAllowanceType,
  deleteAllowanceType,
  createEmployeeAllowance,
  updateEmployeeAllowance,
  deleteEmployeeAllowance,
} from "@/services/allowanceService";
import { useAllowanceTypes } from "../hooks/useAllowanceTypes";
import { useEmployeeAllowances } from "../hooks/useEmployeeAllowances";
import { useEmployeeSalaryList } from "../hooks/useEmployeeSalaryList";

const formatEmployeeName = (emp: any) => {
  if (emp.first_name && emp.last_name) {
    return `${emp.first_name} ${emp.middle_name || ""} ${emp.last_name}${emp.suffix ? `, ${emp.suffix}` : ""}`.trim();
  }
  return emp.name || "";
};

const AllowanceSettings = () => {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const { data: allowanceTypesData } = useAllowanceTypes();
  const allowanceTypes = allowanceTypesData ?? [];

  const { data: employeesData, isLoading } = useEmployeeSalaryList(currentPage, rowsPerPage, search);
  const employees = employeesData?.data ?? [];
  const totalPages = employeesData?.pagination?.totalPages ?? 1;
  const totalRecords = employeesData?.pagination?.total ?? 0;

  const { data: employeeAllowancesData } = useEmployeeAllowances(selectedEmployee?.id ?? null);
  const employeeAllowances = employeeAllowancesData ?? [];

  const [typeSearch, setTypeSearch] = useState("");
  const [typeSearchInput, setTypeSearchInput] = useState("");

  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [typeForm, setTypeForm] = useState({
    name: "",
    description: "",
    default_amount: "",
    taxable: false,
    recurring: false,
    frequency: "monthly",
  });

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({
    allowance_type_id: "",
    amount: "",
  });

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setTypeSearch(typeSearchInput);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [typeSearchInput]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const resetTypeForm = () => {
    setTypeForm({
      name: "",
      description: "",
      default_amount: "",
      taxable: false,
      recurring: false,
      frequency: "monthly",
    });
  };

  const handleOpenAddType = () => {
    setEditingType(null);
    resetTypeForm();
    setShowTypeDialog(true);
  };

  const handleOpenEditType = (type: any) => {
    setEditingType(type);
    setTypeForm({
      name: type.name || "",
      description: type.description || "",
      default_amount: type.default_amount?.toString() || "",
      taxable: type.taxable ?? false,
      recurring: type.recurring ?? false,
      frequency: type.frequency || "monthly",
    });
    setShowTypeDialog(true);
  };

  const handleSaveType = async () => {
    if (!typeForm.name) {
      return toast.error("Name is required");
    }

    try {
      const payload = {
        name: typeForm.name,
        description: typeForm.description,
        default_amount: Number(typeForm.default_amount) || 0,
        taxable: typeForm.taxable,
        recurring: typeForm.recurring,
        frequency: typeForm.frequency,
      };

      if (editingType) {
        await updateAllowanceType(editingType.id, payload);
        toast.success("Allowance type updated");
      } else {
        await createAllowanceType(payload);
        toast.success("Allowance type created");
      }

      setShowTypeDialog(false);
      queryClient.invalidateQueries({ queryKey: ["allowance-types"] });
    } catch {
      toast.error("Failed to save allowance type");
    }
  };

  const handleDeleteType = async (id: number) => {
    try {
      await deleteAllowanceType(id);
      toast.success("Allowance type deleted");
      queryClient.invalidateQueries({ queryKey: ["allowance-types"] });
    } catch {
      toast.error("Failed to delete allowance type");
    }
  };

  const handleOpenAssign = () => {
    if (!selectedEmployee) return;
    setAssignForm({ allowance_type_id: "", amount: "" });
    setShowAssignDialog(true);
  };

  const handleSaveAssign = async () => {
    if (!assignForm.allowance_type_id || !assignForm.amount) {
      return toast.error("Fill all fields");
    }

    try {
      await createEmployeeAllowance({
        employee_id: selectedEmployee.id,
        allowance_type_id: Number(assignForm.allowance_type_id),
        amount: Number(assignForm.amount),
      });
      toast.success("Allowance assigned");
      setShowAssignDialog(false);
      queryClient.invalidateQueries({ queryKey: ["employee-allowances", selectedEmployee.id] });
    } catch {
      toast.error("Failed to assign allowance");
    }
  };

  const handleUpdateAssignedAmount = async (id: number, amount: string) => {
    try {
      await updateEmployeeAllowance(id, { amount: Number(amount) });
      toast.success("Amount updated");
      queryClient.invalidateQueries({ queryKey: ["employee-allowances", selectedEmployee.id] });
    } catch {
      toast.error("Failed to update amount");
    }
  };

  const handleRemoveAssigned = async (id: number) => {
    try {
      await deleteEmployeeAllowance(id);
      toast.success("Allowance removed");
      queryClient.invalidateQueries({ queryKey: ["employee-allowances", selectedEmployee.id] });
    } catch {
      toast.error("Failed to remove allowance");
    }
  };

  const filteredTypes = allowanceTypes.filter((t: any) =>
    t.name?.toLowerCase().includes(typeSearch.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Allowance Settings</h1>
        <p className="text-muted-foreground">
          Manage allowance types and per-employee allowances
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Allowance Types</CardTitle>
            <Button size="sm" onClick={handleOpenAddType}>
              <Plus className="h-4 w-4 mr-1" /> Add Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search allowance types..."
                value={typeSearchInput}
                onChange={(e) => setTypeSearchInput(e.target.value)}
                className="pl-9 max-w-sm"
              />
            </div>
          </div>

          <div className="rounded-md border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Default Amount</TableHead>
                  <TableHead>Taxable</TableHead>
                  <TableHead>Recurring</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No allowance types found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTypes.map((type: any) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell className="text-muted-foreground">{type.description || "-"}</TableCell>
                      <TableCell>₱{Number(type.default_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={type.taxable ? "default" : "secondary"}>
                          {type.taxable ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={type.recurring ? "default" : "secondary"}>
                          {type.recurring ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{type.frequency || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenEditType(type)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteType(type.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      <Card>
        <CardHeader>
          <CardTitle>Per-Employee Allowance Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or employee code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 max-w-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <div className="rounded-md border shadow-sm mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        {searchInput
                          ? "No employees found matching your search"
                          : "No employees found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp: any) => (
                      <TableRow
                        key={emp.id}
                        className={`cursor-pointer ${selectedEmployee?.id === emp.id ? "bg-muted" : ""}`}
                        onClick={() => setSelectedEmployee(emp)}
                      >
                        <TableCell className="font-medium">{formatEmployeeName(emp)}</TableCell>
                        <TableCell>{emp.employee_code}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={selectedEmployee?.id === emp.id ? "default" : "outline"}
                            onClick={(e) => { e.stopPropagation(); setSelectedEmployee(emp); }}
                          >
                            {selectedEmployee?.id === emp.id ? "Selected" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <TablePagination
                page={currentPage}
                totalPages={totalPages}
                totalItems={totalRecords}
                pageSize={rowsPerPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setRowsPerPage(size); setCurrentPage(1); }}
              />
            </div>
          )}

          {selectedEmployee ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatEmployeeName(selectedEmployee)}</p>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.employee_code}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleOpenAssign}>
                    <Plus className="h-4 w-4 mr-1" /> Assign Allowance
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedEmployee(null)}>
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                </div>
              </div>

              {employeeAllowances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No allowances assigned to this employee
                </p>
              ) : (
                <div className="rounded-md border shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Allowance Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Taxable</TableHead>
                        <TableHead>Recurring</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeAllowances.map((ea: any) => (
                        <TableRow key={ea.id}>
                          <TableCell className="font-medium">{ea.allowance_type?.name || ea.allowance_type_name || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>₱</span>
                              <Input
                                type="number"
                                className="w-32 h-8"
                                defaultValue={ea.amount || 0}
                                onBlur={(e) => {
                                  const val = e.target.value;
                                  if (Number(val) !== Number(ea.amount)) {
                                    handleUpdateAssignedAmount(ea.id, val);
                                  }
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ea.taxable ? "default" : "secondary"}>
                              {ea.taxable ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ea.recurring ? "default" : "secondary"}>
                              {ea.recurring ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => handleRemoveAssigned(ea.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Select an employee from the table above to manage their allowances
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="max-w-lg! w-full">
          <DialogHeader>
            <DialogTitle>{editingType ? "Edit Allowance Type" : "Add Allowance Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Name</label>
              <Input
                placeholder="Allowance name"
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Description</label>
              <Input
                placeholder="Optional description"
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Default Amount</label>
              <Input
                type="number"
                placeholder="0"
                value={typeForm.default_amount}
                onChange={(e) => setTypeForm({ ...typeForm, default_amount: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={typeForm.taxable}
                  onCheckedChange={(checked) => setTypeForm({ ...typeForm, taxable: checked })}
                />
                <label className="text-sm">Taxable</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={typeForm.recurring}
                  onCheckedChange={(checked) => setTypeForm({ ...typeForm, recurring: checked })}
                />
                <label className="text-sm">Recurring</label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Frequency</label>
              <Select
                value={typeForm.frequency}
                onValueChange={(value) => setTypeForm({ ...typeForm, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="one-time">One Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveType} className="w-full">
              {editingType ? "Update Allowance Type" : "Create Allowance Type"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-lg! w-full">
          <DialogHeader>
            <DialogTitle>Assign Allowance to Employee</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedEmployee && formatEmployeeName(selectedEmployee)}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Allowance Type</label>
              <Select
                value={assignForm.allowance_type_id}
                onValueChange={(value) => setAssignForm({ ...assignForm, allowance_type_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select allowance type" />
                </SelectTrigger>
                <SelectContent>
                  {allowanceTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} (₱{Number(type.default_amount || 0).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Amount</label>
              <Input
                type="number"
                placeholder="0"
                value={assignForm.amount}
                onChange={(e) => setAssignForm({ ...assignForm, amount: e.target.value })}
              />
            </div>
            <Button onClick={handleSaveAssign} className="w-full">
              Assign Allowance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllowanceSettings;
