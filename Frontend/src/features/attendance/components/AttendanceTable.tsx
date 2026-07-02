import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileClock } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { formatDateLocal, formatTimeLocal, getTimezoneAbbr } from "@/utils/formatDate";

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
  check_in_time_utc?: string | null;
  check_out_time_utc?: string | null;
  timezone_used?: string | null;
  attendance_branch_id?: number | null;
  device_id?: number | null;
  source?: string | null;
  date: string;
  status: string;
  branch_name?: string | null;
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

const getFullName = (item: Attendance) => {
  if (item.first_name && item.last_name) {
    return `${item.first_name} ${item.middle_name || ""} ${item.last_name}${item.suffix ? `, ${item.suffix}` : ""}`.trim();
  }
  return item.name || `${item.first_name} ${item.last_name}`.trim();
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PRESENT":
      return <Badge variant="default">PRESENT</Badge>;
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
      return <Badge variant="destructive">ABSENT</Badge>;
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
      return <Badge variant="secondary">{status}</Badge>;
  }
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
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Employee Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Source</TableHead>
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
                <TableCell>{item.branch_name || "Main Branch"}</TableCell>
                <TableCell>
                  {item.source && (
                    <Badge
                      variant={
                        item.source === "BIOMETRIC" ? "default"
                        : item.source === "WEB" ? "secondary"
                        : item.source === "MANUAL" ? "outline"
                        : "secondary"
                      }
                      className={
                        item.source === "BIOMETRIC"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : item.source === "WEB"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : item.source === "MANUAL"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
                      }
                    >
                      {item.source === "IMPORT" ? "IMPORT" : item.source}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-sm">
                      {formatTimeLocal(item.check_in_time_utc || item.check_in_time, item.timezone_used ?? undefined)}
                    </span>
                    {item.timezone_used && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none">
                        {getTimezoneAbbr(item.timezone_used)}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {formatDateLocal(item.date)}
                  </span>
                </TableCell>
                <TableCell>
                  {item.check_out_time ? (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm">
                        {formatTimeLocal(item.check_out_time_utc || item.check_out_time, item.timezone_used ?? undefined)}
                      </span>
                      {item.timezone_used && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none">
                          {getTimezoneAbbr(item.timezone_used)}
                        </Badge>
                      )}
                    </div>
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
              <TableCell colSpan={onRequestModification ? 9 : 8} className="text-center py-8">
                <EmptyState message="No attendance records found" />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={totalRecords}
        pageSize={rowsPerPage}
        onPageChange={onPageChange}
        onPageSizeChange={(size) => { onRowsPerPageChange(size); onPageChange(1); }}
      />
    </div>
  );
};

export default memo(AttendanceTable);
