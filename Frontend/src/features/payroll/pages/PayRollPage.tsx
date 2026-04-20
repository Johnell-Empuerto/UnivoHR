import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Plus,
  CheckCircle,
  Search,
  Wallet,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PayrollTable from "../components/PayrollTable";
import PayrollSummary from "../components/PayrollSummary";
import PayrollSettings from "./PayrollSettings";
import PayrollGenerate from "./PayrollGenerate";
import {
  getPayroll,
  getPayrollSummary,
  markAllPayrollAsPaid,
  deletePayrollByCutoff,
} from "@/services/payrollService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/formatDate";
import FinalPayTable from "../components/FinalPayTable";
import { getEmployeesForFinalPay } from "@/services/finalPayService";

const PayRollPage = () => {
  console.log("PayRollPage component RENDERED");

  const navigate = useNavigate();

  // Payroll Records Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Payroll Records State
  const [date, setDate] = useState<Date>(new Date());
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("records");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  // Payroll Records Search state
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Final Pay Pagination State
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [pendingRowsPerPage, setPendingRowsPerPage] = useState(10);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [pendingTotalRecords, setPendingTotalRecords] = useState(0);
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingSearchInput, setPendingSearchInput] = useState("");

  // Final Pay State
  const [finalPayEmployees, setFinalPayEmployees] = useState<any[]>([]);
  const [finalPayLoading, setFinalPayLoading] = useState(false);

  // Refs for scroll restoration
  const isPageChangeRef = useRef(false);
  const savedScrollPositionRef = useRef(0);
  const fetchCountRef = useRef(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const cutoffStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const cutoffEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const cutoffStartStr = format(cutoffStart, "yyyy-MM-dd");
  const cutoffEndStr = format(cutoffEnd, "yyyy-MM-dd");

  // ============================================
  // PAYROLL RECORDS FUNCTIONS
  // ============================================
  const fetchPayroll = useCallback(async () => {
    fetchCountRef.current++;
    console.log(`fetchPayroll called (${fetchCountRef.current} times)`);
    console.log(`   - currentPage: ${currentPage}`);
    console.log(`   - rowsPerPage: ${rowsPerPage}`);
    console.log(`   - search: "${search}"`);

    try {
      setLoading(true);

      const payroll = await getPayroll(
        cutoffStartStr,
        cutoffEndStr,
        currentPage,
        rowsPerPage,
        search,
      );

      console.log(`Payroll data received: ${payroll.data.length} records`);

      setPayrollData(payroll.data);
      setTotalPages(payroll.pagination.totalPages);
      setTotalRecords(payroll.pagination.total);

      const summaryData = await getPayrollSummary(cutoffStartStr, cutoffEndStr);
      setSummary(summaryData);

      // Restore scroll position after page change
      if (isPageChangeRef.current) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (savedScrollPositionRef.current > 0) {
              window.scrollTo({
                top: savedScrollPositionRef.current,
                behavior: "instant",
              });
            } else if (tableContainerRef.current) {
              tableContainerRef.current.scrollIntoView({
                behavior: "instant",
                block: "start",
              });
            }
            isPageChangeRef.current = false;
          });
        });
      }
    } catch (error) {
      console.error("fetchPayroll error:", error);
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  }, [cutoffStartStr, cutoffEndStr, currentPage, rowsPerPage, search]);

  const groupPayroll = (data: any[]) => {
    const groups: Record<string, any[]> = {};

    data.forEach((item) => {
      const key = `${item.cutoff_start}_${item.cutoff_end}_${item.pay_date}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  };

  const toLocalDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  };

  const handleGeneratePayroll = async () => {
    await fetchPayroll();
    setActiveTab("records");
  };

  const handleDeleteBatch = async () => {
    if (!selectedBatch) return;

    try {
      await deletePayrollByCutoff(
        toLocalDate(selectedBatch.cutoff_start),
        toLocalDate(selectedBatch.cutoff_end),
        toLocalDate(selectedBatch.pay_date),
      );

      toast.success("Payroll deleted successfully");
      fetchPayroll();
      setDeleteDialogOpen(false);
      setSelectedBatch(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete payroll");
    }
  };

  const handleMarkBatchPaid = async () => {
    if (!selectedBatch) return;

    try {
      await markAllPayrollAsPaid(
        toLocalDate(selectedBatch.cutoff_start),
        toLocalDate(selectedBatch.cutoff_end),
      );

      toast.success("Batch marked as paid successfully");
      fetchPayroll();
      setMarkPaidDialogOpen(false);
      setSelectedBatch(null);
    } catch (err: any) {
      console.error("Mark batch error:", err);
      if (err?.response) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to mark batch as paid");
      }
    }
  };

  // ============================================
  // FINAL PAY FUNCTIONS (WITH PAGINATION)
  // ============================================
  const fetchFinalPayEmployees = async () => {
    try {
      setFinalPayLoading(true);
      const result = await getEmployeesForFinalPay(
        pendingCurrentPage,
        pendingRowsPerPage,
        pendingSearch,
      );
      if (result.success) {
        setFinalPayEmployees(result.data);
        setPendingTotalPages(result.pagination.totalPages);
        setPendingTotalRecords(result.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch final pay employees:", error);
      toast.error("Failed to load resigned employees");
    } finally {
      setFinalPayLoading(false);
    }
  };

  // ============================================
  // EVENT HANDLERS
  // ============================================
  const handlePageChange = useCallback(
    (page: number) => {
      const currentScrollY = window.scrollY;
      savedScrollPositionRef.current = currentScrollY;
      isPageChangeRef.current = true;
      setCurrentPage(page);
    },
    [currentPage],
  );

  const handleRowsPerPageChange = useCallback(
    (newRows: number) => {
      const currentScrollY = window.scrollY;
      savedScrollPositionRef.current = currentScrollY;
      isPageChangeRef.current = true;
      setRowsPerPage(newRows);
      setCurrentPage(1);
    },
    [rowsPerPage],
  );

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setCurrentPage(1);
  };

  const handlePendingSearchInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPendingSearchInput(e.target.value);
    setPendingCurrentPage(1);
  };

  const handleViewDetails = (record: any) => {
    if (!record.payroll_id) {
      toast.error("Payroll not generated yet");
      return;
    }

    navigate(`/payroll/details/${record.payroll_id}`, {
      state: { record },
    });
  };

  const handleExport = () => {
    toast.info("Export feature coming soon");
  };

  // ============================================
  // EFFECTS
  // ============================================
  // Debounce search for payroll records
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Debounce search for final pay
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPendingSearch(pendingSearchInput);
      setPendingCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [pendingSearchInput]);

  // Fetch payroll records when dependencies change
  useEffect(() => {
    if (activeTab === "records") {
      fetchPayroll();
    }
  }, [date, activeTab, currentPage, rowsPerPage, search, fetchPayroll]);

  // Fetch final pay employees when dependencies change
  useEffect(() => {
    if (activeTab === "final-pay") {
      fetchFinalPayEmployees();
    }
  }, [activeTab, pendingCurrentPage, pendingRowsPerPage, pendingSearch]);

  const groupedPayroll = useMemo(
    () => groupPayroll(payrollData),
    [payrollData],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage, generate, and configure employee payroll
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="records">Payroll Records</TabsTrigger>
          <TabsTrigger value="final-pay">Final Pay</TabsTrigger>
          <TabsTrigger value="generate">Generate Payroll</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* PAYROLL RECORDS TAB */}
        {/* ============================================ */}
        <TabsContent value="records" className="mt-6 space-y-6">
          {/* FILTERS */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Payroll Period:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(date, "MMMM yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex-1 min-w-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by employee name or code..."
                      value={searchInput}
                      onChange={handleSearchInputChange}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button onClick={fetchPayroll} variant="ghost">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {summary && <PayrollSummary summary={summary} />}

          {/* Payroll Records Container */}
          <div ref={tableContainerRef} className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="mt-2 text-muted-foreground">Loading...</p>
              </div>
            ) : payrollData.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p>
                    {search
                      ? "No payroll records found matching your search"
                      : "No payroll data found"}
                  </p>
                  <Button
                    onClick={() => setActiveTab("generate")}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Payroll
                  </Button>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedPayroll).map(([key, records]) => {
                const first = records[0];
                const hasPaid = records.some((r) => r.status === "PAID");
                const allPaid = records.every((r) => r.status === "PAID");

                return (
                  <Card key={key}>
                    <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                      <div>
                        <CardTitle>
                          📅 {formatDate(first.cutoff_start)} →{" "}
                          {formatDate(first.cutoff_end)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Pay Date: {formatDate(first.pay_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={allPaid}
                          onClick={() => {
                            setSelectedBatch({
                              cutoff_start: first.cutoff_start,
                              cutoff_end: first.cutoff_end,
                              pay_date: first.pay_date,
                            });
                            setMarkPaidDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Batch Paid
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={hasPaid}
                          onClick={() => {
                            setSelectedBatch({
                              cutoff_start: first.cutoff_start,
                              cutoff_end: first.cutoff_end,
                              pay_date: first.pay_date,
                            });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          Delete Batch
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <PayrollTable
                        data={records}
                        onViewDetails={handleViewDetails}
                        onExport={handleExport}
                        onRefresh={fetchPayroll}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        rowsPerPage={rowsPerPage}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        totalRecords={totalRecords}
                      />
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* FINAL PAY TAB (WITH PAGINATION) */}
        {/* ============================================ */}
        <TabsContent value="final-pay" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                Final Pay Processing
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Process final pay for resigned and terminated employees
              </p>
            </CardHeader>
            <CardContent>
              {/* Pending Search Input */}
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pending by name or code..."
                    value={pendingSearchInput}
                    onChange={handlePendingSearchInputChange}
                    className="pl-9"
                  />
                </div>
              </div>

              {finalPayLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <FinalPayTable
                  data={finalPayEmployees}
                  onRefresh={fetchFinalPayEmployees}
                  pendingPagination={{
                    page: pendingCurrentPage,
                    limit: pendingRowsPerPage,
                    total: pendingTotalRecords,
                    totalPages: pendingTotalPages,
                  }}
                  onPendingPageChange={setPendingCurrentPage}
                  onPendingLimitChange={(limit) => {
                    setPendingRowsPerPage(limit);
                    setPendingCurrentPage(1);
                  }}
                  pendingLoading={finalPayLoading}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* GENERATE PAYROLL TAB */}
        {/* ============================================ */}
        <TabsContent value="generate">
          <PayrollGenerate onGenerateComplete={handleGeneratePayroll} />
        </TabsContent>

        {/* ============================================ */}
        {/* SETTINGS TAB */}
        {/* ============================================ */}
        <TabsContent value="settings">
          <PayrollSettings />
        </TabsContent>
      </Tabs>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the payroll batch for{" "}
              {selectedBatch && (
                <span className="font-semibold">
                  {formatDate(selectedBatch.cutoff_start)} →{" "}
                  {formatDate(selectedBatch.cutoff_end)}
                </span>
              )}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBatch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MARK BATCH PAID CONFIRMATION DIALOG */}
      <AlertDialog
        open={markPaidDialogOpen}
        onOpenChange={setMarkPaidDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Batch as Paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark ALL employees in this payroll batch as paid for the
              period{" "}
              {selectedBatch && (
                <span className="font-semibold">
                  {formatDate(selectedBatch.cutoff_start)} →{" "}
                  {formatDate(selectedBatch.cutoff_end)}
                </span>
              )}
              . This action can be reverted by marking individual records as
              unpaid if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkBatchPaid}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Yes, Mark as Paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PayRollPage;
