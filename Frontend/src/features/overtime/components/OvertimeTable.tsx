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
import {
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/formatDate";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";

type OvertimeStatus = "PENDING" | "APPROVED" | "REJECTED";

type OvertimeRequest = {
  id: number;
  employee_name?: string;
  employee_code?: string;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  reason: string;
  status: OvertimeStatus;
  created_at: string;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejected_by_name?: string | null;
  rejected_at?: string | null;
  rejected_reason?: string | null;
};

type OvertimeTableProps = {
  data: OvertimeRequest[];
  onView?: (request: OvertimeRequest) => void | Promise<void>;
  onApprove?: (id: number) => void | Promise<void>;
  onReject?: (id: number) => void | Promise<void>;
  onDelete?: (id: number) => void | Promise<void>;
  canApprove?: boolean;
  title?: string;
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  rowsPerPage?: number;
};

const getStatusBadge = (status: OvertimeStatus) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          PENDING
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge variant="default">
          <CheckCircle className="h-3 w-3 mr-1" />
          APPROVED
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          REJECTED
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const OvertimeTable = ({
  data,
  onView,
  onApprove,
  onReject,
  onDelete,
  canApprove = false,
  title = "Overtime Requests",
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPage = 10,
}: OvertimeTableProps) => {


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                {data[0]?.employee_name && <TableHead>Employee</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Hours</TableHead>
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
                    {item.employee_name && (
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.employee_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.employee_code}
                          </p>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>{item.start_time}</TableCell>
                    <TableCell>{item.end_time}</TableCell>
                    <TableCell>{item.hours}h</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onView(item)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {canApprove && item.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              onClick={() => onApprove?.(item.id)}
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => onReject?.(item.id)}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {onDelete && item.status !== "APPROVED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete(item.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={data[0]?.employee_name ? 7 : 6} className="text-center py-8">
                    <EmptyState message="No overtime requests found" />
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
          onPageChange={(p) => onPageChange?.(p)}
          onPageSizeChange={(size) => { onRowsPerPageChange?.(size); onPageChange?.(1); }}
        />
      </CardContent>
    </Card>
  );
};

export default memo(OvertimeTable);
