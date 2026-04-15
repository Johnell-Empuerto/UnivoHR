"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/utils/formatDate";

type ManHourReport = {
  id: number;
  employee_name?: string;
  employee_code?: string;
  employee_id?: number;
  work_date: string;
  task: string;
  hours: number;
  remarks?: string | null;
  created_at: string;
  is_assigned_approver?: boolean;
  status?: string;
};

type Props = {
  data: ManHourReport[];
  onView: (report: ManHourReport) => void;
  onEdit?: (report: ManHourReport) => void;
  onDelete?: (id: number) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  canApprove: boolean;
  canEdit?: boolean;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  rowsPerPage: number;
  title?: string;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "APPROVED":
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
        >
          APPROVED
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="destructive"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
        >
          REJECTED
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
        >
          PENDING
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
        >
          {status}
        </Badge>
      );
  }
};

const ManHourReportTable = ({
  data,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  canApprove,
  canEdit = false,
  currentPage,
  totalPages,
  totalRecords,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPage,
  title = "Man Hour Reports",
}: Props) => {
  // Helper to get status - convert SUBMITTED to PENDING for display
  const getDisplayStatus = (report: ManHourReport) => {
    const status = report.status || "SUBMITTED";
    if (status === "SUBMITTED") return "PENDING";
    return status;
  };

  // Pagination calculations
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

  // Generate page numbers for pagination
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

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Employee</TableHead>
                <TableHead>Work Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                {canApprove && <TableHead>Approval</TableHead>}
                {(canEdit || canApprove) && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canApprove || canEdit ? 6 : 5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No man hour reports found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((report) => {
                  const displayStatus = getDisplayStatus(report);
                  // Only show action buttons if status is PENDING (SUBMITTED)
                  const isPending = report.status === "SUBMITTED";

                  return (
                    <TableRow
                      key={report.id}
                      className="border-b border-gray-400/50 dark:border-gray-400/50"
                    >
                      <TableCell className="font-medium">
                        <div>
                          {report.employee_name || "N/A"}
                          {report.employee_code && (
                            <div className="text-xs text-muted-foreground">
                              {report.employee_code}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>{formatDate(report.work_date)}</TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
                        >
                          {report.hours} hrs
                        </Badge>
                      </TableCell>

                      <TableCell>{getStatusBadge(displayStatus)}</TableCell>

                      {/* Admin Approval Buttons - Only show for PENDING reports */}
                      {canApprove && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => onApprove(report.id)}
                                  className="p-1 rounded hover:bg-green-100 transition"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </button>
                                <button
                                  onClick={() => onReject(report.id)}
                                  className="p-1 rounded hover:bg-red-100 transition"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Processed
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {/* Action Buttons (View/Edit/Delete) */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 rounded hover:bg-muted transition"
                            onClick={() => onView(report)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                          {canEdit && isPending && onEdit && (
                            <button
                              className="p-1 rounded hover:bg-muted transition"
                              onClick={() => onEdit(report)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 text-blue-600 hover:text-blue-700" />
                            </button>
                          )}
                          {canEdit && isPending && onDelete && (
                            <button
                              className="p-1 rounded hover:bg-muted transition"
                              onClick={() => onDelete(report.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600 hover:text-red-700" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls - Matching AttendanceTable styling */}
        {totalRecords > 0 && (
          <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Rows per page */}
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

            {/* Showing X to Y of Z */}
            <div className="text-sm text-muted-foreground">
              Showing {start} to {end} of {totalRecords} entries
            </div>

            {/* Pagination Buttons */}
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
    </Card>
  );
};

export default ManHourReportTable;
