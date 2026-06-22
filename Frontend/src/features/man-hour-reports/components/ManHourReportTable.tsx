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
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";

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
          className={getStatusBadgeClass("success")}
        >
          APPROVED
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="destructive"
          className={getStatusBadgeClass("danger")}
        >
          REJECTED
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge
          variant="secondary"
          className={getStatusBadgeClass("warning")}
        >
          PENDING
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className={getStatusBadgeClass("neutral")}
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



  return (
    <Card>
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
                <TableHead>Task</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                {canApprove && <TableHead>Approval</TableHead>}
                {(canEdit || canApprove) && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canApprove || canEdit ? 8 : 7} className="text-center py-8">
                    <EmptyState message="No man hour reports found" />
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

                      <TableCell className="max-w-40 truncate" title={report.task}>
                        {report.task || "-"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
                        >
                          {report.hours} hrs
                        </Badge>
                      </TableCell>

                      <TableCell>{getStatusBadge(displayStatus)}</TableCell>

                      <TableCell>{formatDate(report.created_at)}</TableCell>

                      {/* Admin Approval Buttons - Only show for PENDING reports */}
                      {canApprove && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isPending ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  onClick={() => onApprove(report.id)}
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  onClick={() => onReject(report.id)}
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onView(report)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit && isPending && onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onEdit(report)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && isPending && onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => onDelete(report.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={totalRecords}
          pageSize={rowsPerPage}
          onPageChange={onPageChange}
          onPageSizeChange={(size) => { onRowsPerPageChange(size); onPageChange(1); }}
        />
      </CardContent>
    </Card>
  );
};

export default ManHourReportTable;
