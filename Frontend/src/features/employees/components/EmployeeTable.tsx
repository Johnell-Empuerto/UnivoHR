import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Pencil, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import EmployeeDrawer from "./EmployeeDrawer";
import { Button } from "@/components/ui/Button";

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

  const handleDrawerClose = () => {
    setOpen(false);
    setSelectedEmployee(null);
  };

  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalRecords);

  const goToPage = (page: number) => {
    onPageChange(Math.max(1, Math.min(page, totalPages)));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRows = Number(e.target.value);
    onRowsPerPageChange(newRows);
    onPageChange(1);
  };

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++)
          pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "RESIGNED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "TERMINATED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {canCreate && (
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
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Employee Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
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
                    <TableCell>{item.department || "-"}</TableCell>
                    <TableCell>{item.position || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canView && (
                          <button
                            className="p-1 rounded hover:bg-muted transition"
                            onClick={() => {
                              setSelectedEmployee(item);
                              setMode("view");
                              setOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            className="p-1 rounded hover:bg-muted transition"
                            onClick={() => {
                              setSelectedEmployee(item);
                              setMode("edit");
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalRecords > 0 && (
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Rows per page:
              </span>
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="border rounded px-2 py-1 text-sm bg-background"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {start} to {end} of {totalRecords} entries
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {getPageNumbers().map((page, index) => (
                <Button
                  key={index}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => typeof page === "number" && goToPage(page)}
                  disabled={page === "..."}
                  className={`h-8 w-8 p-0 ${page === "..." ? "cursor-default" : ""}`}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
    </Card>
  );
};

export default EmployeeTable;
