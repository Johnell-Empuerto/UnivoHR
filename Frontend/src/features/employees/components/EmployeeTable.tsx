import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Pencil, Plus, Upload } from "lucide-react";
import { useState, memo } from "react";
import EmployeeDrawer from "./EmployeeDrawer";
import BulkImportDialog from "./BulkImportDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";

type Employee = {
  id: number;
  name: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
  employee_code: string;
  department: string;
  position: string;
  status: string;
  [key: string]: any;
};

type EmployeeTableProps = {
  data: Employee[];
  onUpdate: (updated: Employee) => void;
  onCreate: (newEmp: Employee) => void;
  canEdit: boolean;
  canCreate: boolean;
  canView: boolean;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  rowsPerPage: number;
  title?: string;
};

const EmployeeTable = ({
  data,
  onUpdate,
  onCreate,
  canEdit,
  canCreate,
  canView,
  currentPage,
  totalPages,
  totalRecords,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPage,
  title = "Employee Records",
}: EmployeeTableProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [bulkOpen, setBulkOpen] = useState(false);

  const handleDrawerClose = () => {
    setOpen(false);
    setSelectedEmployee(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default">ACTIVE</Badge>;
      case "RESIGNED":
        return <Badge variant="destructive">RESIGNED</Badge>;
      case "TERMINATED":
        return <Badge variant="secondary">TERMINATED</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {canCreate && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setMode("create");
                setSelectedEmployee(null);
                setOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
            <Button
              onClick={() => setBulkOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Employee Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Employment Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-b border-gray-400/50 dark:border-gray-400/50"
                  >
                    <TableCell className="font-medium">
                      {item.employee_code}
                    </TableCell>
                    <TableCell>
                      {`${item.first_name || ""} ${item.middle_name || ""} ${item.last_name || ""}${item.suffix ? `, ${item.suffix}` : ""}`.trim()}
                    </TableCell>
                    <TableCell>{item.branch_name || "No Branch"}</TableCell>
                    <TableCell>{item.department || "-"}</TableCell>
                    <TableCell>{item.position || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.employment_status === "REGULAR"
                            ? getStatusBadgeClass("success")
                            : item.employment_status === "PROBATIONARY"
                              ? getStatusBadgeClass("warning")
                              : getStatusBadgeClass("neutral")
                        }
                      >
                        {item.employment_status || "REGULAR"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedEmployee(item);
                              setMode("view");
                              setOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedEmployee(item);
                              setMode("edit");
                              setOpen(true);
                            }}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <EmptyState message="No employees found" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={totalRecords}
          pageSize={rowsPerPage}
          onPageChange={onPageChange}
          onPageSizeChange={(size) => { onRowsPerPageChange(size); onPageChange(1); }}
        />
      </CardContent>

      <EmployeeDrawer
        open={open}
        onClose={handleDrawerClose}
        employee={selectedEmployee}
        mode={mode}
        onUpdate={mode === "create" ? onCreate : onUpdate}
        canEdit={canEdit}
        canCreate={canCreate}
        canView={canView}
      />

      <BulkImportDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImportComplete={() => onPageChange(currentPage)}
      />
    </Card>
  );
};

export default memo(EmployeeTable);
