"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  approveManHourReport,
  rejectManHourReport,
  downloadManHourReports,
} from "@/services/manHourReportService";
import ErrorMessage from "@/components/shared/ErrorMessage";
import Loader from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Loader2,
  RefreshCw,
  FileText,
  Download,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import ManHourReportTable from "../components/ManHourReportTable";
import ManHourReportDrawer from "../components/ManHourReportDrawer";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/app/providers/AuthProvider";
import { useManHourReports } from "../hooks/useManHourReports";
import { useIsManHourApprover } from "../hooks/useIsManHourApprover";
import { useManHourReportDetail } from "../hooks/useManHourReportDetail";

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

const ManHoursApproval = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  // ==========================================
  // DOWNLOAD STATE
  // ==========================================
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"csv" | "excel" | "pdf">(
    "csv",
  );
  const [downloadStartDate, setDownloadStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [downloadEndDate, setDownloadEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [downloadEmployeeId, setDownloadEmployeeId] = useState("");
  const [downloading, setDownloading] = useState(false);

  const { data: queryData, isLoading, isFetching, isError, error } = useManHourReports(
    currentPage, rowsPerPage, search, dateFilter
  );
  const { data: isUserApprover } = useIsManHourApprover(!!user?.id);
  const { data: selectedReport } = useManHourReportDetail(selectedReportId);

  const data = queryData?.data ?? [];
  const totalPages = queryData?.pagination?.totalPages ?? 1;
  const totalRecords = queryData?.pagination?.total ?? 0;

  const canShowApprovalActions = () => {
    return hasPermission("manhours.approve") || isUserApprover;
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setDateFilter("");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setSearchInput("");
    setSearch("");
    setDateFilter("");
    queryClient.invalidateQueries({ queryKey: ["man-hour-reports"] });
  };

  const handleView = (report: ManHourReport) => {
    setSelectedReportId(report.id);
    setIsDrawerOpen(true);
  };

  const handleApprove = async (id: number) => {
    try {
      setProcessing(true);
      await approveManHourReport(id);
      toast.success("Man hour report approved");
      queryClient.invalidateQueries({ queryKey: ["man-hour-reports"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to approve report");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessing(true);
      await rejectManHourReport(rejectingId, { reason: rejectReason });
      toast.success("Man hour report rejected");
      setIsRejectModalOpen(false);
      setRejectReason("");
      setRejectingId(null);
      queryClient.invalidateQueries({ queryKey: ["man-hour-reports"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to reject report");
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================
  // DOWNLOAD HANDLER
  // ==========================================
  const handleDownload = async () => {
    if (!downloadStartDate || !downloadEndDate) {
      toast.error("Please select start and end dates");
      return;
    }

    setDownloading(true);
    try {
      const blob = await downloadManHourReports({
        start_date: downloadStartDate,
        end_date: downloadEndDate,
        employee_id: downloadEmployeeId || undefined,
        format: downloadFormat,
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;

      const extension = downloadFormat === "excel" ? "xlsx" : downloadFormat;
      link.setAttribute(
        "download",
        `man_hour_report_${downloadStartDate}_to_${downloadEndDate}.${extension}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Report downloaded as ${extension.toUpperCase()}`);
      setIsDownloadDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  if (isError) return <ErrorMessage title="Error" message={(error as any)?.message || "Failed to fetch"} />;

  return (
    <div className="space-y-6 p-6">
      {/* Header with Download Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-muted-foreground">
              Man Hours Approval
            </h1>
            <p className="text-sm text-muted-foreground">
              Review and approve employee man hour reports
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 text-muted-foreground"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setDownloadFormat("csv");
                setIsDownloadDialogOpen(true);
              }}
            >
              <FileCode className="h-4 w-4 mr-2" />
              CSV Format
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setDownloadFormat("excel");
                setIsDownloadDialogOpen(true);
              }}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel Format
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setDownloadFormat("pdf");
                setIsDownloadDialogOpen(true);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF Format
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name, code, or task..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>

            <Input
              type="date"
              placeholder="Filter by date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            />

            {(searchInput || dateFilter) && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}

            <Button onClick={handleRefresh} variant="ghost">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {(isLoading || isFetching) && <Loader message="Loading man hour reports..." />}

      {/* Man Hour Reports Table */}
      <ManHourReportTable
        data={data}
        onView={handleView}
        onApprove={handleApprove}
        onReject={(id) => {
          setRejectingId(id);
          setIsRejectModalOpen(true);
        }}
        canApprove={canShowApprovalActions()}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        rowsPerPage={rowsPerPage}
        title="Man Hour Reports for Approval"
      />

      {/* Details Drawer */}
      <ManHourReportDrawer
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedReportId(null);
        }}
        report={selectedReport}
      />

      {/* Reject Reason Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-lg! w-full sm:max-w-lg!">
          <DialogHeader>
            <DialogTitle>Reject Man Hour Report</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason("");
                  setRejectingId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing}
              >
                {processing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Dialog */}
      <Dialog
        open={isDownloadDialogOpen}
        onOpenChange={setIsDownloadDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Download Man Hour Report</DialogTitle>
            <DialogDescription>
              Select date range and format to download the report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={downloadStartDate}
                  onChange={(e) => setDownloadStartDate(e.target.value)}
                  max={downloadEndDate}
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={downloadEndDate}
                  onChange={(e) => setDownloadEndDate(e.target.value)}
                  min={downloadStartDate}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div>
              <Label>Filter by Employee (Optional)</Label>
              <Input
                type="text"
                placeholder="Employee ID or leave blank for all employees"
                value={downloadEmployeeId}
                onChange={(e) => setDownloadEmployeeId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to include all employees (default)
              </p>
            </div>

            <div>
              <Label>Format</Label>
              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant={downloadFormat === "csv" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDownloadFormat("csv")}
                >
                  CSV
                </Button>
                <Button
                  type="button"
                  variant={downloadFormat === "excel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDownloadFormat("excel")}
                >
                  Excel
                </Button>
                <Button
                  type="button"
                  variant={downloadFormat === "pdf" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDownloadFormat("pdf")}
                >
                  PDF
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDownloadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Download {downloadFormat.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManHoursApproval;
