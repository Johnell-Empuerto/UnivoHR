import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { attendance as attendanceApi } from "@/services/attendanceService";
import {
  createTimeModificationRequest,
  getMyTimeModificationRequests,
  getAllTimeModificationRequests,
  updateTimeModificationStatus,
} from "@/services/attendanceService";
import AttendanceTable from "../components/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Loader2,
  X,
  FileClock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { useAuth } from "@/app/providers/AuthProvider";

const AttendancePage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin =
    user?.role === "ADMIN" || user?.role === "HR_ADMIN" || user?.role === "HR";

  // Read tab from query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "time-requests") {
      setActiveTab("time-requests");
    }
  }, [location.search]);

  // ========== ATTENDANCE TAB STATE ==========
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  // ========== TIME REQUEST TAB STATE ==========
  const [activeTab, setActiveTab] = useState("attendance");
  const [timeRequests, setTimeRequests] = useState<any[]>([]);
  const [timeRequestsLoading, setTimeRequestsLoading] = useState(false);

  // Time Requests Pagination State
  const [timeRequestsPage, setTimeRequestsPage] = useState(1);
  const [timeRequestsRowsPerPage, setTimeRequestsRowsPerPage] = useState(10);
  const [timeRequestsTotalPages, setTimeRequestsTotalPages] = useState(1);
  const [timeRequestsTotalRecords, setTimeRequestsTotalRecords] = useState(0);

  // Request Form State
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [requestForm, setRequestForm] = useState({
    attendance_id: "",
    requested_check_in: "",
    requested_check_out: "",
    reason: "",
  });

  // Approval/Rejection dialog
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionRequest, setActionRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED" | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Fetch attendance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await attendanceApi(
          currentPage,
          rowsPerPage,
          search,
          statusFilter,
          formattedDate,
        );
        setAttendanceData(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalRecords(result.pagination.total);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to fetch attendance records");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, rowsPerPage, search, statusFilter, formattedDate]);

  // Fetch time requests when tab changes or pagination changes
  useEffect(() => {
    if (activeTab === "time-requests") {
      fetchTimeRequests();
    }
  }, [activeTab, timeRequestsPage, timeRequestsRowsPerPage]);

  const fetchTimeRequests = async () => {
    try {
      setTimeRequestsLoading(true);

      // Use backend pagination
      const result = isAdmin
        ? await getAllTimeModificationRequests(
            timeRequestsPage,
            timeRequestsRowsPerPage,
          )
        : await getMyTimeModificationRequests(
            timeRequestsPage,
            timeRequestsRowsPerPage,
          );

      // Handle both paginated and non-paginated responses
      if (result.data && result.pagination) {
        // Paginated response
        setTimeRequests(result.data);
        setTimeRequestsTotalPages(result.pagination.totalPages);
        setTimeRequestsTotalRecords(result.pagination.total);
      } else if (Array.isArray(result)) {
        // Fallback for non-paginated response (manual pagination)
        const start = (timeRequestsPage - 1) * timeRequestsRowsPerPage;
        const end = start + timeRequestsRowsPerPage;
        const paginatedData = result.slice(start, end);
        setTimeRequests(paginatedData);
        setTimeRequestsTotalRecords(result.length);
        setTimeRequestsTotalPages(
          Math.ceil(result.length / timeRequestsRowsPerPage),
        );
      } else {
        setTimeRequests([]);
        setTimeRequestsTotalRecords(0);
        setTimeRequestsTotalPages(1);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch time requests");
      setTimeRequests([]);
      setTimeRequestsTotalRecords(0);
      setTimeRequestsTotalPages(1);
    } finally {
      setTimeRequestsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setSelectedDate(new Date());
    setCurrentPage(1);
  };

  const activeFilterCount = [searchInput, statusFilter].filter(Boolean).length;

  // ========== TIME REQUEST HANDLERS ==========
  const openRequestForm = (attendance: any) => {
    setSelectedAttendance(attendance);
    setRequestForm({
      attendance_id: attendance.id.toString(),
      requested_check_in: attendance.check_in_time
        ? format(new Date(attendance.check_in_time), "HH:mm")
        : "",
      requested_check_out: attendance.check_out_time
        ? format(new Date(attendance.check_out_time), "HH:mm")
        : "",
      reason: "",
    });
    setRequestFormOpen(true);
  };

  const submitTimeRequest = async () => {
    try {
      await createTimeModificationRequest({
        attendance_id: parseInt(requestForm.attendance_id),
        requested_check_in: requestForm.requested_check_in,
        requested_check_out: requestForm.requested_check_out,
        reason: requestForm.reason,
      });
      toast.success("Time modification request submitted successfully");
      setRequestFormOpen(false);
      setRequestForm({
        attendance_id: "",
        requested_check_in: "",
        requested_check_out: "",
        reason: "",
      });
      fetchTimeRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const openActionDialog = (request: any, action: "APPROVED" | "REJECTED") => {
    setActionRequest(request);
    setActionType(action);
    setRejectionReason("");
    setActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!actionRequest || !actionType) return;

    try {
      setActionLoading(true);
      await updateTimeModificationStatus(actionRequest.id, {
        status: actionType,
        rejection_reason:
          actionType === "REJECTED" ? rejectionReason : undefined,
      });
      toast.success(`Request ${actionType.toLowerCase()} successfully`);
      setActionDialogOpen(false);
      fetchTimeRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge for time requests - matching PayrollTable Badge pattern
  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
          >
            PENDING
          </Badge>
        );
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

  // Pagination helper functions for time requests
  const start = (timeRequestsPage - 1) * timeRequestsRowsPerPage + 1;
  const end = Math.min(
    timeRequestsPage * timeRequestsRowsPerPage,
    timeRequestsTotalRecords,
  );

  const goToPage = (page: number) => {
    setTimeRequestsPage(Math.max(1, Math.min(page, timeRequestsTotalPages)));
  };

  const handleTimeRequestsRowsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newRows = Number(e.target.value);
    setTimeRequestsRowsPerPage(newRows);
    setTimeRequestsPage(1);
  };

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (timeRequestsTotalPages <= maxPagesToShow) {
      for (let i = 1; i <= timeRequestsTotalPages; i++) pageNumbers.push(i);
    } else {
      if (timeRequestsPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(timeRequestsTotalPages);
      } else if (timeRequestsPage >= timeRequestsTotalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (
          let i = timeRequestsTotalPages - 3;
          i <= timeRequestsTotalPages;
          i++
        )
          pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = timeRequestsPage - 1; i <= timeRequestsPage + 1; i++)
          pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(timeRequestsTotalPages);
      }
    }
    return pageNumbers;
  };

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Monitor employee attendance and manage time modification requests.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="attendance">
            <Clock className="h-4 w-4 mr-2" />
            Attendance Records
          </TabsTrigger>
          <TabsTrigger value="time-requests">
            <FileClock className="h-4 w-4 mr-2" />
            Time Requests
          </TabsTrigger>
        </TabsList>

        {/* ========== ATTENDANCE TAB ========== */}
        <TabsContent value="attendance" className="space-y-6">
          {/* Filters Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or employee code..."
                      value={searchInput}
                      onChange={handleSearchChange}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="w-32">
                  <select
                    value={statusFilter || "all"}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="border rounded px-3 py-2 text-sm bg-background w-full"
                  >
                    <option value="all">All Status</option>
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LEAVE">On Leave</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={formattedDate}
                    onChange={(e) => {
                      setSelectedDate(new Date(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded px-3 py-2 text-sm bg-background"
                  />
                </div>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">
                Loading attendance records...
              </span>
            </div>
          )}

          {/* Table */}
          <Card>
            <CardContent className="p-4">
              <AttendanceTable
                data={attendanceData}
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalRecords}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={setRowsPerPage}
                onRequestModification={!isAdmin ? openRequestForm : undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TIME REQUESTS TAB - WITH BACKEND PAGINATION ========== */}
        <TabsContent value="time-requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileClock className="h-5 w-5" />
                {isAdmin
                  ? "All Time Modification Requests"
                  : "My Time Modification Requests"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {timeRequestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Loading requests...
                  </span>
                </div>
              ) : timeRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No time modification requests found</p>
                  {!isAdmin && (
                    <p className="text-sm mt-2">
                      Go to the Attendance Records tab to submit a request
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        {isAdmin && <TableHead>Employee</TableHead>}
                        <TableHead>Date</TableHead>
                        <TableHead>Original Time</TableHead>
                        <TableHead>Requested Time</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        {isAdmin && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeRequests.map((request) => (
                        <TableRow key={request.id}>
                          {isAdmin && (
                            <TableCell className="font-medium">
                              {request.employee_name || request.employee_code}
                            </TableCell>
                          )}
                          <TableCell>
                            {request.attendance_date
                              ? format(
                                  new Date(request.attendance_date),
                                  "MMM dd, yyyy",
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>
                                In:{" "}
                                {request.original_check_in
                                  ? format(
                                      new Date(request.original_check_in),
                                      "HH:mm",
                                    )
                                  : "-"}
                              </div>
                              <div>
                                Out:{" "}
                                {request.original_check_out
                                  ? format(
                                      new Date(request.original_check_out),
                                      "HH:mm",
                                    )
                                  : "-"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-primary">
                              <div>In: {request.requested_check_in || "-"}</div>
                              <div>
                                Out: {request.requested_check_out || "-"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell
                            className="max-w-xs truncate"
                            title={request.reason}
                          >
                            {request.reason}
                          </TableCell>
                          <TableCell>
                            {getRequestStatusBadge(request.status)}
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              {request.status === "PENDING" ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"
                                    onClick={() =>
                                      openActionDialog(request, "APPROVED")
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                    onClick={() =>
                                      openActionDialog(request, "REJECTED")
                                    }
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  {request.reviewed_by
                                    ? `By ${request.reviewer_name || "Admin"}`
                                    : "-"}
                                </span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls - Matching AttendanceTable styling */}
                  {timeRequestsTotalRecords > 0 && (
                    <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                      {/* Rows per page */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Rows per page:
                        </span>
                        <select
                          value={timeRequestsRowsPerPage}
                          onChange={handleTimeRequestsRowsPerPageChange}
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
                        Showing {start} to {end} of {timeRequestsTotalRecords}{" "}
                        entries
                      </div>

                      {/* Pagination Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(timeRequestsPage - 1)}
                          disabled={timeRequestsPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {getPageNumbers().map((page, index) => (
                          <Button
                            key={index}
                            variant={
                              timeRequestsPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              typeof page === "number" && goToPage(page)
                            }
                            disabled={page === "..."}
                            className={`h-8 w-8 p-0 ${page === "..." ? "cursor-default" : ""}`}
                          >
                            {page}
                          </Button>
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(timeRequestsPage + 1)}
                          disabled={timeRequestsPage === timeRequestsTotalPages}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Form Dialog */}
      <Dialog open={requestFormOpen} onOpenChange={setRequestFormOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Request Time Modification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAttendance && (
              <div className="bg-muted p-3 rounded text-sm">
                <p className="font-medium">
                  Attendance Date:{" "}
                  {format(new Date(selectedAttendance.date), "MMM dd, yyyy")}
                </p>
                <p className="text-muted-foreground">
                  Current:{" "}
                  {selectedAttendance.check_in_time
                    ? format(
                        new Date(selectedAttendance.check_in_time),
                        "HH:mm",
                      )
                    : "-"}{" "}
                  -{" "}
                  {selectedAttendance.check_out_time
                    ? format(
                        new Date(selectedAttendance.check_out_time),
                        "HH:mm",
                      )
                    : "-"}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check_in">Requested Check-in Time *</Label>
                <Input
                  id="check_in"
                  type="time"
                  value={requestForm.requested_check_in}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      requested_check_in: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="check_out">Requested Check-out Time *</Label>
                <Input
                  id="check_out"
                  type="time"
                  value={requestForm.requested_check_out}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      requested_check_out: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Modification *</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why you need this time modification..."
                value={requestForm.reason}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, reason: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitTimeRequest}
              disabled={
                !requestForm.requested_check_in ||
                !requestForm.requested_check_out ||
                !requestForm.reason.trim()
              }
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Approve/Reject) */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-112.5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "APPROVED" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Approve Request
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Reject Request
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {actionRequest && (
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded text-sm">
                  <p>
                    <strong>Employee:</strong> {actionRequest.employee_name}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {actionRequest.attendance_date
                      ? format(
                          new Date(actionRequest.attendance_date),
                          "MMM dd, yyyy",
                        )
                      : "-"}
                  </p>
                  <p>
                    <strong>Requested Time:</strong>{" "}
                    {actionRequest.requested_check_in} -{" "}
                    {actionRequest.requested_check_out}
                  </p>
                </div>
                {actionType === "REJECTED" && (
                  <div className="space-y-2">
                    <Label htmlFor="rejection_reason">
                      Rejection Reason *{" "}
                      <span className="text-red-500">(required)</span>
                    </Label>
                    <Textarea
                      id="rejection_reason"
                      placeholder="Please provide a reason for rejecting this request..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
                {actionType === "APPROVED" && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <p>
                      Approving this request will update the employee&apos;s
                      attendance record with the new times.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                actionLoading ||
                (actionType === "REJECTED" && !rejectionReason.trim())
              }
              variant={actionType === "REJECTED" ? "destructive" : "default"}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : actionType === "APPROVED" ? (
                "Approve Request"
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendancePage;
