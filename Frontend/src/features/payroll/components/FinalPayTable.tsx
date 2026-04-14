import { useState, useEffect } from "react";
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
import { Eye, DollarSign, Loader2, CheckCircle, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  processFinalPay,
  calculateFinalPay,
  getFinalPayHistory,
  downloadFinalPaySlip,
} from "@/services/finalPayService";
import { formatDate } from "@/utils/formatDate";

interface FinalPayEmployee {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  employee_code: string;
  status: "RESIGNED" | "TERMINATED";
  resignation_date?: string;
  termination_date?: string;
  final_pay_processed: boolean;
  final_pay_amount?: number;
  basic_salary?: number;
  daily_rate?: number;
  vacation_leave?: number;
  used_vacation_leave?: number;
}

interface FinalPayRecord {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  employee_code: string;
  status: string;
  resignation_date?: string;
  termination_date?: string;
  last_working_date: string;
  days_worked: number;
  salary_until_last_day: number;
  leave_conversion_amount: number;
  total_amount: number;
  processed_by_name?: string;
  processed_at: string;
}

interface FinalPayTableProps {
  data: FinalPayEmployee[];
  onRefresh: () => void;
}

const formatCurrency = (value: number) => {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatEmployeeName = (emp: FinalPayEmployee | FinalPayRecord) => {
  return `${emp.first_name} ${emp.middle_name || ""} ${emp.last_name}${emp.suffix ? `, ${emp.suffix}` : ""}`.trim();
};

const FinalPayTable = ({ data, onRefresh }: FinalPayTableProps) => {
  const [selectedEmployee, setSelectedEmployee] =
    useState<FinalPayEmployee | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // History state
  const [historyData, setHistoryData] = useState<FinalPayRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(5);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalRecords, setHistoryTotalRecords] = useState(0);
  const [historySearch, setHistorySearch] = useState("");
  const [historySearchInput, setHistorySearchInput] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<FinalPayRecord | null>(
    null,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Fetch history
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const result = await getFinalPayHistory(
        historyCurrentPage,
        historyRowsPerPage,
        historySearch,
      );
      setHistoryData(result.data);
      setHistoryTotalPages(result.pagination.totalPages);
      setHistoryTotalRecords(result.pagination.total);
    } catch (error) {
      console.error("Failed to fetch final pay history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Debounce search for history
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setHistorySearch(historySearchInput);
      setHistoryCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [historySearchInput]);

  // Fetch history when page/rows/search changes
  useEffect(() => {
    fetchHistory();
  }, [historyCurrentPage, historyRowsPerPage, historySearch]);

  // Refresh history after processing
  useEffect(() => {
    if (!previewOpen && !processOpen) {
      fetchHistory();
    }
  }, [previewOpen, processOpen]);

  const handlePreview = async (employee: FinalPayEmployee) => {
    try {
      setLoading(true);
      setSelectedEmployee(employee);
      const result = await calculateFinalPay(employee.id);
      if (result.success) {
        setPreviewData(result.data);
        setPreviewOpen(true);
      } else {
        toast.error(result.message || "Failed to calculate final pay");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to calculate final pay",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedEmployee) return;

    try {
      setProcessing(true);
      const result = await processFinalPay(selectedEmployee.id);
      if (result.success) {
        toast.success(result.message);
        setProcessOpen(false);
        setPreviewOpen(false);
        onRefresh();
        fetchHistory(); // Refresh history after processing
      } else {
        toast.error(result.message || "Failed to process final pay");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to process final pay",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (record: FinalPayRecord) => {
    try {
      setDownloading(true);
      const blob = await downloadFinalPaySlip(record.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `final-pay-${record.employee_code}-${record.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Final pay slip downloaded");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download");
    } finally {
      setDownloading(false);
    }
  };

  const handleViewDetails = (record: FinalPayRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const getStatusBadge = (_status: string, processed: boolean) => {
    if (processed) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Processed
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      >
        Pending
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    return status === "RESIGNED" ? "🔴" : "⚫";
  };

  const getSeparationDate = (emp: FinalPayEmployee) => {
    const date = emp.resignation_date || emp.termination_date;
    return date ? formatDate(date) : "—";
  };

  // History pagination helpers
  const historyStart = (historyCurrentPage - 1) * historyRowsPerPage + 1;
  const historyEnd = Math.min(
    historyCurrentPage * historyRowsPerPage,
    historyTotalRecords,
  );

  const goToHistoryPage = (page: number) => {
    setHistoryCurrentPage(Math.max(1, Math.min(page, historyTotalPages)));
  };

  const handleHistoryRowsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setHistoryRowsPerPage(Number(e.target.value));
    setHistoryCurrentPage(1);
  };

  const getHistoryPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (historyTotalPages <= maxPagesToShow) {
      for (let i = 1; i <= historyTotalPages; i++) pageNumbers.push(i);
    } else {
      if (historyCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(historyTotalPages);
      } else if (historyCurrentPage >= historyTotalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = historyTotalPages - 3; i <= historyTotalPages; i++)
          pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = historyCurrentPage - 1; i <= historyCurrentPage + 1; i++)
          pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(historyTotalPages);
      }
    }
    return pageNumbers;
  };

  return (
    <div className="space-y-8">
      {/* PENDING FINAL PAY TABLE */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <span className="text-yellow-600">⏳</span>
          </div>
          <h2 className="text-xl font-semibold">Pending Final Pay</h2>
          <Badge variant="secondary" className="ml-2">
            {data.length}
          </Badge>
        </div>
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Status</TableHead>
                <TableHead>Employee Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Separation Date</TableHead>
                <TableHead>Final Pay Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No pending final pay records
                  </TableCell>
                </TableRow>
              ) : (
                data.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(emp.status)} {emp.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {emp.employee_code}
                    </TableCell>
                    <TableCell>{formatEmployeeName(emp)}</TableCell>
                    <TableCell>{getSeparationDate(emp)}</TableCell>
                    <TableCell>
                      {getStatusBadge(emp.status, emp.final_pay_processed)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {emp.final_pay_amount
                        ? `₱${formatCurrency(emp.final_pay_amount)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(emp)}
                        disabled={emp.final_pay_processed}
                        className="h-8"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* HISTORY TABLE - Processed Final Pay */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600">✅</span>
          </div>
          <h2 className="text-xl font-semibold">Processed Final Pay History</h2>
          <Badge variant="secondary" className="ml-2">
            {historyTotalRecords}
          </Badge>
        </div>

        {/* History Search */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <input
              type="text"
              placeholder="Search history by name or code..."
              value={historySearchInput}
              onChange={(e) => setHistorySearchInput(e.target.value)}
              className="w-full border rounded-md px-3 py-2 pl-9 text-sm"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Employee Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Working Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Processed Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">
                      Loading history...
                    </p>
                  </TableCell>
                </TableRow>
              ) : historyData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No processed final pay records found
                  </TableCell>
                </TableRow>
              ) : (
                historyData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.employee_code}
                    </TableCell>
                    <TableCell>{formatEmployeeName(record)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          record.status === "RESIGNED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}
                      >
                        {record.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatDate(record.last_working_date)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ₱{formatCurrency(record.total_amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(record.processed_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(record)}
                          className="h-8 w-8 p-0"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(record)}
                          disabled={downloading}
                          className="h-8 w-8 p-0"
                          title="Download"
                        >
                          {downloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* History Pagination */}
        {historyTotalRecords > 0 && (
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Rows per page:
              </span>
              <select
                value={historyRowsPerPage}
                onChange={handleHistoryRowsPerPageChange}
                className="border rounded px-2 py-1 text-sm bg-background"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {historyStart} to {historyEnd} of {historyTotalRecords}{" "}
              entries
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToHistoryPage(historyCurrentPage - 1)}
                disabled={historyCurrentPage === 1}
                className="h-8 w-8 p-0"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>

              {getHistoryPageNumbers().map((page, index) => (
                <Button
                  key={index}
                  variant={historyCurrentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    typeof page === "number" && goToHistoryPage(page)
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
                onClick={() => goToHistoryPage(historyCurrentPage + 1)}
                disabled={historyCurrentPage === historyTotalPages}
                className="h-8 w-8 p-0"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Final Pay Preview</DialogTitle>
            <DialogDescription>
              {selectedEmployee && formatEmployeeName(selectedEmployee)} (
              {selectedEmployee?.employee_code})
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium flex items-center gap-1">
                    {getStatusIcon(previewData.status)} {previewData.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Separation Date
                  </p>
                  <p className="font-medium">
                    {previewData.last_working_date
                      ? formatDate(previewData.last_working_date)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Worked</p>
                  <p className="font-medium">{previewData.display_days} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Rate</p>
                  <p className="font-medium">
                    ₱{formatCurrency(previewData.daily_rate)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span>Salary until last day</span>
                  <span className="font-semibold">
                    ₱{formatCurrency(previewData.salary_until_last_day)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Unused Vacation Leave</span>
                  <span>{previewData.unused_vacation_leave} days</span>
                </div>
                <div className="flex justify-between py-2 border-b text-blue-600">
                  <span>🎉 Leave Conversion</span>
                  <span className="font-semibold">
                    +₱{formatCurrency(previewData.leave_conversion_amount)}
                  </span>
                </div>
                <div className="flex justify-between py-3 mt-2 border-t-2">
                  <span className="text-lg font-bold">Total Final Pay</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₱{formatCurrency(previewData.total_final_pay)}
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setPreviewOpen(false);
                    setProcessOpen(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Final Pay
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load preview data
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Confirmation Dialog */}
      <Dialog open={processOpen} onOpenChange={setProcessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Final Pay?</DialogTitle>
            <DialogDescription>
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Process leave conversion for unused vacation leave</li>
                <li>Mark employee as final pay processed</li>
                <li>Create a final pay record in the system</li>
              </ul>
              <p className="mt-4 font-semibold text-yellow-600">
                ⚠️ This action cannot be undone!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {processing ? "Processing..." : "Confirm Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog for History */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Final Pay Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Employee</p>
                  <p className="font-medium">
                    {formatEmployeeName(selectedRecord)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedRecord.employee_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedRecord.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Last Working Date
                  </p>
                  <p className="font-medium">
                    {formatDate(selectedRecord.last_working_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Worked</p>
                  <p className="font-medium">
                    {selectedRecord.days_worked} days
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span>Salary until last day</span>
                  <span className="font-semibold">
                    ₱{formatCurrency(selectedRecord.salary_until_last_day)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b text-blue-600">
                  <span>🎉 Leave Conversion</span>
                  <span className="font-semibold">
                    +₱{formatCurrency(selectedRecord.leave_conversion_amount)}
                  </span>
                </div>
                <div className="flex justify-between py-3 mt-2 border-t-2">
                  <span className="text-lg font-bold">Total Final Pay</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₱{formatCurrency(selectedRecord.total_amount)}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-sm text-muted-foreground border-t">
                <p>
                  Processed by: {selectedRecord.processed_by_name || "System"}
                </p>
                <p>Processed at: {formatDate(selectedRecord.processed_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinalPayTable;
