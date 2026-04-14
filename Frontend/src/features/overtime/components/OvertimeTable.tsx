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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/formatDate";

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
  rejected_reason?: string | null;
};

type OvertimeTableProps = {
  data: OvertimeRequest[];
  onView?: (request: OvertimeRequest) => void | Promise<void>;
  onApprove?: (id: number) => void | Promise<void>;
  onReject?: (id: number) => void | Promise<void>;
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
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <Clock className="h-3 w-3 mr-1" />
          PENDING
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          APPROVED
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="h-3 w-3 mr-1" />
          REJECTED
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const OvertimeTable = ({
  data,
  onView,
  onApprove,
  onReject,
  canApprove = false,
  title = "Overtime Requests",
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPage = 10,
}: OvertimeTableProps) => {
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalRecords);

  const goToPage = (page: number) => {
    if (onPageChange) {
      onPageChange(Math.max(1, Math.min(page, totalPages)));
    }
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRows = Number(e.target.value);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRows);
    }
    if (onPageChange) {
      onPageChange(1);
    }
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

  return (
    <Card className="shadow-sm">
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
                          <button
                            className="p-1 rounded hover:bg-muted transition"
                            onClick={() => onView(item)}
                          >
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                        {canApprove && item.status === "PENDING" && (
                          <>
                            <button
                              className="p-1 rounded hover:bg-green-100 transition"
                              onClick={() => onApprove?.(item.id)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-red-100 transition"
                              onClick={() => onReject?.(item.id)}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={data[0]?.employee_name ? 7 : 6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No overtime requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalRecords > 0 && (
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
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

export default OvertimeTable;
