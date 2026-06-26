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
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import LeaveDrawer from "./LeaveDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { useEnabledLeaveTypes } from "@/hooks/useLeaveTypes";
import { getTypeColor, getTypeLabel, normalizeCode } from "../utils/leaveTypeUtils";
import { useAuth } from "@/app/providers/AuthProvider";

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
  const code = normalizeCode(type);
  const c = getTypeColor(code);
  return (
    <Badge variant="outline" className={`${c.bg} ${c.text} ${c.border} ${c.darkBg} ${c.darkText} ${c.darkBorder}`}>
      {getTypeLabel(code)}
    </Badge>
  );
};

// Search and Filter Component
const SearchFilters = ({
  onSearch,
  onStatusFilter,
  onTypeFilter,
  onRefresh,
}: any) => {
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("_all");
  const [typeFilter, setTypeFilter] = useState("_all");
  const { data: leaveTypes = [] } = useEnabledLeaveTypes();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, onSearch]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onStatusFilter?.(value === "_all" ? "" : value);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    onTypeFilter?.(value === "_all" ? "" : value);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setStatusFilter("_all");
    setTypeFilter("_all");
    onSearch?.("");
    onStatusFilter?.("");
    onTypeFilter?.("");
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="relative flex-1 min-w-50">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by employee name or code..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-8"
        />
      </div>

      <Select value={statusFilter} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All Status</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Select value={typeFilter} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All Types</SelectItem>
          {leaveTypes.map((lt: any) => (
            <SelectItem key={lt.id} value={lt.code}>{lt.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(searchInput || statusFilter !== "_all" || typeFilter !== "_all") && (
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
  const { hasPermission } = useAuth();
  const canApprove = hasPermission("leave.approve");
  const canFileForOthers = hasPermission("leave.create_for_others");
  const [leaves, setLeaves] = useState<Leave[]>(data);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
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

  return (
    <Card>
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
        {/* Search and Filters */}
        {(onSearch || onStatusFilter || onTypeFilter) && (
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
                    {canApprove && <TableHead>Actions</TableHead>}
                    <TableHead>View</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {leaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canApprove ? 8 : 7} className="text-center py-8">
                        <EmptyState message="No leave requests found" />
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

                        {/* Approval Buttons */}
                        {canApprove && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {leave.status === "PENDING" ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                    onClick={() => handleStatusUpdate(leave.id, "APPROVED")}
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    onClick={() => handleStatusUpdate(leave.id, "REJECTED")}
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

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedLeave(leave);
                              setMode("view");
                              setOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {pagination && pagination.total > 0 && (
              <TablePagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(p) => onPageChange?.(p)}
                onPageSizeChange={(size) => { onLimitChange?.(size); onPageChange?.(1); }}
              />
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
        canFileForOthers={canFileForOthers}
      />
    </Card>
  );
};

export default LeaveTable;
