import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getFinalPayHistory,
  downloadFinalPaySlip,
} from "@/services/finalPayService";
import { formatDate } from "@/utils/formatDate";
import { toast } from "sonner";

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

const formatCurrency = (value: number) => {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatEmployeeName = (record: FinalPayRecord) => {
  return `${record.first_name} ${record.middle_name || ""} ${record.last_name}${record.suffix ? `, ${record.suffix}` : ""}`.trim();
};

const FinalPayHistoryTable = () => {
  const [data, setData] = useState<FinalPayRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<FinalPayRecord | null>(
    null,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Fetch history
  useEffect(() => {
    fetchHistory();
  }, [currentPage, rowsPerPage, search]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const result = await getFinalPayHistory(currentPage, rowsPerPage, search);
      setData(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalRecords(result.pagination.total);
    } catch (error) {
      console.error("Failed to fetch final pay history:", error);
      toast.error("Failed to load final pay history");
    } finally {
      setLoading(false);
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

  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalRecords);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Final Pay History</h1>
          <p className="text-sm text-muted-foreground">
            View all processed final pay records
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processed Final Pay Records</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name or code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-muted-foreground">Loading...</p>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No final pay records found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((record) => (
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

          {/* Pagination */}
          {totalRecords > 0 && (
            <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
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

              <div className="text-sm text-muted-foreground">
                Showing {start} to {end} of {totalRecords} entries
              </div>

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

      {/* Details Dialog */}
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

export default FinalPayHistoryTable;
