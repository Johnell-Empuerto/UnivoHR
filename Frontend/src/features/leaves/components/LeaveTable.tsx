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
  Plus,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import LeaveDrawer from "./LeaveDrawer";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";

type Leave = {
  id: number;
  employee_name: string;
  employee_code?: string;
  type: string;
  from_date?: string;
  to_date?: string;
  reason?: string;
  status: string;
  day_fraction?: number;
  half_day_type?: "MORNING" | "AFTERNOON" | null;
  rejection_reason?: string | null;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  suffix?: string;
};

type PaginationProps = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type LeaveTableProps = {
  data: Leave[];
  isAdmin: boolean;
  onUpdate: (id: number, status: string, rejectionReason?: string) => void;
  onCreate?: () => void;
  title?: string;
  pagination?: PaginationProps;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSearch?: (search: string) => void;
  onStatusFilter?: (status: string) => void;
  onTypeFilter?: (type: string) => void;
  loading?: boolean;
};

const formatEmployeeName = (leave: Leave) => {
  if (leave.first_name && leave.last_name) {
    return `${leave.first_name} ${leave.middle_name || ""} ${leave.last_name}${leave.suffix ? `, ${leave.suffix}` : ""}`.trim();
  }
  return leave.employee_name || "";
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
    case "PENDING":
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

const getTypeBadge = (type: string) => {
  switch (type) {
    case "SICK":
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
        >
          SICK
        </Badge>
      );
    case "ANNUAL":
      return (
        <Badge
          variant="outline"
          className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800"
        >
          VACATION
        </Badge>
      );
    case "MATERNITY":
      return (
        <Badge
          variant="outline"
          className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800"
        >
          MATERNITY
        </Badge>
      );
    case "EMERGENCY":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
        >
          EMERGENCY
        </Badge>
      );
    case "NO_PAY":
      return (
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-800"
        >
          NO PAY
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
        >
          {type}
        </Badge>
      );
  }
};

// Search and Filter Component
const SearchFilters = ({
  onSearch,
  onStatusFilter,
  onTypeFilter,
  onRefresh,
}: any) => {
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, onSearch]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onStatusFilter?.(value);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    onTypeFilter?.(value);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setStatusFilter("");
    setTypeFilter("");
    onSearch?.("");
    onStatusFilter?.("");
    onTypeFilter?.("");
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="relative flex-1 min-w-50">
        <input
          type="text"
          placeholder="Search by employee name or code..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full px-3 py-2 pl-9 border rounded-md bg-background"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="px-3 py-2 border rounded-md bg-background"
      >
        <option value="">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>

      <select
        value={typeFilter}
        onChange={(e) => handleTypeChange(e.target.value)}
        className="px-3 py-2 border rounded-md bg-background"
      >
        <option value="">All Types</option>
        <option value="SICK">Sick Leave</option>
        <option value="ANNUAL">Vacation Leave</option>
        <option value="MATERNITY">Maternity Leave</option>
        <option value="EMERGENCY">Emergency Leave</option>
        <option value="NO_PAY">No Pay Leave</option>
      </select>

      {(searchInput || statusFilter || typeFilter) && (
        <Button variant="ghost" onClick={handleClearFilters}>
          Clear Filters
        </Button>
      )}

      <Button onClick={onRefresh} variant="ghost">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
};

const LeaveTable = ({
  data,
  isAdmin,
  onUpdate,
  onCreate,
  title = "Leave Requests",
  pagination,
  onPageChange,
  onLimitChange,
  onSearch,
  onStatusFilter,
  onTypeFilter,
  loading = false,
}: LeaveTableProps) => {
  const [leaves, setLeaves] = useState<Leave[]>(data);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [rowsPerPage, setRowsPerPage] = useState(pagination?.limit || 10);

  useEffect(() => {
    setLeaves(data);
  }, [data]);

  const handleDrawerClose = () => {
    setOpen(false);
    setSelectedLeave(null);
  };

  const handleStatusUpdate = (id: number, status: string) => {
    onUpdate(id, status);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value);
    setRowsPerPage(newLimit);
    onLimitChange?.(newLimit);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      onPageChange?.(page);
    }
  };

  const getPageNumbers = () => {
    const totalPages = pagination?.totalPages || 1;
    const currentPage = pagination?.page || 1;
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

  const start = pagination ? (pagination.page - 1) * pagination.limit + 1 : 1;
  const end = pagination
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : data.length;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle>{title}</CardTitle>
        {onCreate && (
          <Button
            onClick={() => {
              setMode("create");
              setSelectedLeave(null);
              setOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Request Leave
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Search and Filters - Only show for admin */}
        {isAdmin && (onSearch || onStatusFilter || onTypeFilter) && (
          <SearchFilters
            onSearch={onSearch}
            onStatusFilter={onStatusFilter}
            onTypeFilter={onTypeFilter}
            onRefresh={() => {
              onSearch?.("");
              onStatusFilter?.("");
              onTypeFilter?.("");
              onPageChange?.(1);
            }}
          />
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              Loading leave requests...
            </span>
          </div>
        )}

        {!loading && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                    <TableHead>View</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {leaves.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isAdmin ? 8 : 7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No leave requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaves.map((leave) => (
                      <TableRow
                        key={leave.id}
                        className="border-b border-gray-400/50 dark:border-gray-400/50"
                      >
                        <TableCell className="font-medium">
                          <div>
                            {formatEmployeeName(leave)}
                            {leave.employee_code && (
                              <div className="text-xs text-muted-foreground">
                                {leave.employee_code}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>{getTypeBadge(leave.type)}</TableCell>

                        <TableCell>
                          {leave.from_date ? formatDate(leave.from_date) : "-"}
                        </TableCell>
                        <TableCell>
                          {leave.to_date ? formatDate(leave.to_date) : "-"}
                        </TableCell>

                        <TableCell>
                          {leave.day_fraction === 0.5 ? (
                            <Badge
                              variant="outline"
                              className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            >
                              {leave.half_day_type === "MORNING"
                                ? "Half Day (AM)"
                                : "Half Day (PM)"}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
                            >
                              Full Day
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>{getStatusBadge(leave.status)}</TableCell>

                        {/* Admin Approval Buttons */}
                        {isAdmin && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {leave.status === "PENDING" ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(leave.id, "APPROVED")
                                    }
                                    className="p-1 rounded hover:bg-green-100 transition"
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(leave.id, "REJECTED")
                                    }
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
                            onClick={() => {
                              setSelectedLeave(leave);
                              setMode("view");
                              setOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.total > 0 && (
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
                  Showing {start} to {end} of {pagination.total} entries
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {getPageNumbers().map((page, index) => (
                    <Button
                      key={index}
                      variant={pagination.page === page ? "default" : "outline"}
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
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <LeaveDrawer
        open={open}
        onClose={handleDrawerClose}
        leave={selectedLeave}
        mode={mode}
        onUpdate={() => {
          if (mode === "create" && onCreate) {
            onCreate();
          }
        }}
        isAdmin={isAdmin}
      />
    </Card>
  );
};

export default LeaveTable;
