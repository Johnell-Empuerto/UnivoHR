import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, FileClock } from "lucide-react";
import { formatDate, formatTime } from "@/utils/formatDate";

type Attendance = {
  id: number;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  suffix?: string | null;
  employee_code: string;
  check_in_time: string;
  check_out_time: string;
  date: string;
  status: string;
};

type AttendanceTableProps = {
  data: Attendance[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onRequestModification?: (attendance: Attendance) => void;
};

const AttendanceTable = ({
  data,
  currentPage,
  totalPages,
  totalRecords,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRequestModification,
}: AttendanceTableProps) => {
  // Helper function to get full name
  const getFullName = (item: Attendance) => {
    if (item.first_name && item.last_name) {
      return `${item.first_name} ${item.middle_name || ""} ${item.last_name}${item.suffix ? `, ${item.suffix}` : ""}`.trim();
    }
    return item.name || `${item.first_name} ${item.last_name}`.trim();
  };

  // Updated status badge styling - matching PayrollTable Badge pattern
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
          >
            PRESENT
          </Badge>
        );
      case "LATE":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
          >
            LATE
          </Badge>
        );
      case "ABSENT":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            ABSENT
          </Badge>
        );
      case "LEAVE":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            ON LEAVE
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
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>Employee Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Status</TableHead>
            {onRequestModification && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length > 0 ? (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.employee_code}
                </TableCell>
                <TableCell>{getFullName(item)}</TableCell>
                <TableCell>
                  <span className="font-mono text-sm">
                    {formatTime(item.check_in_time)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {formatDate(item.date)}
                  </span>
                </TableCell>
                <TableCell>
                  {item.check_out_time ? (
                    <span className="font-mono text-sm">
                      {formatTime(item.check_out_time)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                {onRequestModification && (
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-primary"
                      onClick={() => onRequestModification(item)}
                    >
                      <FileClock className="h-4 w-4 mr-1" />
                      Request Change
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={onRequestModification ? 7 : 6}
                className="text-center py-8 text-muted-foreground"
              >
                No attendance records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls - Matching PayrollTable styling */}
      {data.length > 0 && (
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
    </div>
  );
};

export default AttendanceTable;
