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
import { Eye, CheckCircle, XCircle } from "lucide-react";
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
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  canApprove: boolean;
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
  onApprove,
  onReject,
  canApprove,
  currentPage,
  totalPages,
  totalRecords,
  onPageChange,
  rowsPerPage,
  title = "Man Hour Reports",
}: Props) => {
  // Helper to get status - convert SUBMITTED to PENDING for display
  const getDisplayStatus = (report: ManHourReport) => {
    const status = report.status || "SUBMITTED";
    if (status === "SUBMITTED") return "PENDING";
    return status;
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
                {/* <TableHead className="max-w-xs">Task</TableHead> */}
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                {canApprove && <TableHead>Actions</TableHead>}
                <TableHead>View</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canApprove ? 7 : 6}
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

                      {/* <TableCell className="max-w-xs">
                        <div className="truncate" title={report.task}>
                          {report.task}
                        </div>
                      </TableCell> */}

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

                      <TableCell>
                        <button
                          className="p-1 rounded hover:bg-muted transition"
                          onClick={() => onView(report)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalRecords > 0 && (
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, totalRecords)} of{" "}
              {totalRecords} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManHourReportTable;
