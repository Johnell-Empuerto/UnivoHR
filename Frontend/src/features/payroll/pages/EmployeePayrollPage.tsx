import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Loader2,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getMyPayroll,
  getMySalaryDetails,
  downloadPayslip,
} from "@/services/payrollService";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatDate";
import { useAuth } from "@/app/providers/AuthProvider";

// Helper function to format deduction labels
const formatDeductionLabel = (type: string) => {
  switch (type.toUpperCase()) {
    case "SSS":
      return "SSS";
    case "PHILHEALTH":
      return "PhilHealth";
    case "PAGIBIG":
      return "Pag-IBIG";
    case "TAX":
      return "Withholding Tax";
    case "LOAN":
      return "Loan";
    case "OTHER":
      return "Other";
    default:
      return type;
  }
};

// 🔥 Currency formatter
const formatCurrency = (value: number) => {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const EmployeePayrollPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [salaryDetails, setSalaryDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const cutoffStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const cutoffEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const cutoffStartStr = format(cutoffStart, "yyyy-MM-dd");
  const cutoffEndStr = format(cutoffEnd, "yyyy-MM-dd");
  const { user } = useAuth();

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const data = await getMyPayroll(cutoffStartStr, cutoffEndStr);
      setPayrollData(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryDetails = async () => {
    try {
      const data = await getMySalaryDetails();
      setSalaryDetails(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPayroll();
    fetchSalaryDetails();
  }, [date]);

  useEffect(() => {
    if (!user) return;
    fetchPayroll();
    fetchSalaryDetails();
  }, [date, user]);

  const handleViewDetails = (record: any) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const handleDownloadPayslip = async (record: any) => {
    try {
      setDownloadingId(record.id);

      const blob = await downloadPayslip(record.id);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${record.employee_code || record.id}-${format(new Date(), "yyyy-MM-dd")}.pdf`;

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Payslip downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download payslip");
    } finally {
      setDownloadingId(null);
    }
  };

  // Helper to get total government deduction from deductions_list
  const getTotalGovernmentDeduction = (record: any) => {
    if (record.deductions_list && record.deductions_list.length > 0) {
      return record.deductions_list.reduce(
        (sum: number, d: any) => sum + Number(d.amount),
        0,
      );
    }
    return record.government_deduction || 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            My Payroll
          </h1>
          <p className="text-sm text-muted-foreground">
            View your payroll history, salary details, and download payslips
          </p>
        </div>
      </div>

      {/* Salary Overview Cards */}
      {salaryDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-sm bg-linear-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Salary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  ₱{salaryDetails.basic_salary?.toLocaleString() || 0}
                </div>
                <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-500 opacity-70" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Full monthly rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-linear-to-br from-green-50/50 to-transparent dark:from-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Daily Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  ₱{salaryDetails.daily_rate?.toLocaleString() || 0}
                </div>
                <Briefcase className="h-8 w-8 text-green-600 dark:text-green-500 opacity-70" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per day</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-linear-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overtime Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  ₱{salaryDetails.overtime_rate?.toLocaleString() || 0}
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-500 opacity-70" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per hour</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-linear-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Deductions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-red-600">
                  ₱{salaryDetails.total_deductions?.toLocaleString() || 0}
                </div>
                <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-500 opacity-70" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly government deductions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Card */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
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
            <Button onClick={fetchPayroll} variant="ghost">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Records */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Payroll History
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(cutoffStart, "MMM dd")} - {format(cutoffEnd, "MMM dd")}{" "}
            payroll records
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading payroll data...</div>
          ) : payrollData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No payroll records found for this period
              </p>
            </div>
          ) : (
            <div className="rounded-md border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Cutoff Period</TableHead>
                    <TableHead>Pay Date</TableHead>
                    <TableHead>This Cutoff</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {formatDate(record.cutoff_start)} →{" "}
                        {formatDate(record.cutoff_end)}
                      </TableCell>
                      <TableCell>{formatDate(record.pay_date)}</TableCell>
                      <TableCell>
                        ₱{Number(record.basic_salary || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-600">
                        -₱{Number(record.deductions || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ₱{Number(record.net_salary || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "PAID" ? "default" : "secondary"
                          }
                          className={
                            record.status === "PAID"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }
                        >
                          {record.status || "UNPAID"}
                        </Badge>
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
                            onClick={() => handleDownloadPayslip(record)}
                            disabled={downloadingId === record.id}
                            className="h-8 w-8 p-0"
                            title={
                              downloadingId === record.id
                                ? "Downloading..."
                                : "Download Payslip"
                            }
                          >
                            {downloadingId === record.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/*  UPDATED Salary Breakdown Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg! w-full sm:max-w-lg! max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Salary Breakdown</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-medium">
                    {formatDate(selectedRecord.cutoff_start)} →{" "}
                    {formatDate(selectedRecord.cutoff_end)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pay Date</p>
                  <p className="font-medium">
                    {formatDate(selectedRecord.pay_date)}
                  </p>
                </div>
              </div>

              {/*  Monthly Salary Info - NEW */}
              {salaryDetails && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        Monthly Salary
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-500">
                        Your full monthly rate
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      ₱{formatCurrency(salaryDetails.basic_salary || 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* Earnings Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">Earnings</span>
                  <span className="font-medium">Amount</span>
                </div>

                {/* This Cutoff Earnings */}
                <div className="flex justify-between text-sm">
                  <span>This Cutoff Earnings</span>
                  <span>₱{formatCurrency(selectedRecord.basic_salary)}</span>
                </div>

                {/* Show percentage of monthly */}
                {salaryDetails && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Percentage of monthly salary</span>
                    <span>
                      {(
                        (selectedRecord.basic_salary /
                          salaryDetails.basic_salary) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                )}

                {selectedRecord.overtime_pay > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Overtime Pay</span>
                    <span>+₱{formatCurrency(selectedRecord.overtime_pay)}</span>
                  </div>
                )}

                {selectedRecord.leave_conversion &&
                  selectedRecord.leave_conversion > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>🎉 Leave Conversion</span>
                      <span>
                        +₱{formatCurrency(selectedRecord.leave_conversion)}
                      </span>
                    </div>
                  )}
              </div>

              {/* Deductions Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium text-red-600">Deductions</span>
                  <span className="font-medium text-red-600">Amount</span>
                </div>

                {selectedRecord.late_deduction > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Late Deductions</span>
                    <span>
                      -₱{formatCurrency(selectedRecord.late_deduction)}
                    </span>
                  </div>
                )}

                {selectedRecord.absent_deduction > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Absent Deductions</span>
                    <span>
                      -₱{formatCurrency(selectedRecord.absent_deduction)}
                    </span>
                  </div>
                )}

                {selectedRecord.deductions_list &&
                  selectedRecord.deductions_list.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-red-600 font-medium">
                        <span>Government Contributions</span>
                        <span>
                          -₱
                          {formatCurrency(
                            getTotalGovernmentDeduction(selectedRecord),
                          )}
                        </span>
                      </div>
                      <div className="pl-3 space-y-1 border-l-2 border-red-200">
                        {selectedRecord.deductions_list.map(
                          (d: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm text-muted-foreground"
                            >
                              <span>{formatDeductionLabel(d.type)}</span>
                              <span className="text-red-600">
                                -₱{formatCurrency(Number(d.amount))}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {(!selectedRecord.deductions_list ||
                  selectedRecord.deductions_list.length === 0) &&
                  selectedRecord.government_deduction > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Government Contributions</span>
                      <span>
                        -₱{formatCurrency(selectedRecord.government_deduction)}
                      </span>
                    </div>
                  )}

                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total Deductions</span>
                  <span className="text-red-600">
                    -₱{formatCurrency(selectedRecord.deductions)}
                  </span>
                </div>
              </div>

              {/* Net Salary */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Net Salary</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-lg px-4 py-2">
                    ₱{formatCurrency(selectedRecord.net_salary)}
                  </Badge>
                </div>
                <Progress
                  value={
                    (selectedRecord.deductions / selectedRecord.basic_salary) *
                    100
                  }
                  className="mt-2 h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(
                    (selectedRecord.deductions / selectedRecord.basic_salary) *
                    100
                  ).toFixed(1)}
                  % deducted from this cutoff earnings
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => handleDownloadPayslip(selectedRecord)}
                disabled={downloadingId === selectedRecord.id}
              >
                {downloadingId === selectedRecord.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Payslip
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeePayrollPage;
