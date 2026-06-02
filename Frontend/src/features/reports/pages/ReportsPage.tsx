"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import Loader from "@/components/shared/Loader";
import { formatTime } from "@/utils/formatDate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getEmployeeReport,
  getLeaveReport,
  getAttendanceReport,
  getPayrollReport,
  getBenefitsReport,
  getPerformanceReport,
} from "@/services/reportService";
import ExportButton from "../components/ExportButton";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatDate";

const formatCurrency = (value: number) => {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDeductionLabel = (type?: string | null) => {
  if (!type) return "-";
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
    case "SICK":
      return "Sick Leave";
    case "ANNUAL":
      return "Vacation Leave";
    case "MATERNITY":
      return "Maternity Leave";
    case "EMERGENCY":
      return "Emergency Leave";
    case "NO_PAY":
      return "Unpaid Leave";
    default:
      return type;
  }
};

const ReportsPage = () => {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("employees");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const rows = Array.isArray(data) ? data : [];
  const [pageSize, setPageSize] = useState(10);

  const totalPages = pagination.totalPages || 1;
  const currentPage = pagination.page || 1;
  const totalRecords = pagination.total || 0;
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, totalRecords);

  const goToPage = (page: number) =>
    fetchData(Math.max(1, Math.min(page, totalPages)));

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRows = Number(e.target.value);
    setPageSize(newRows);
    fetchData(1);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPages = 5;
    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const getReportType = useCallback(() => {
    if (activeTab === "employees") return reportTypeFilter || "master_list";
    if (activeTab === "leaves") return reportTypeFilter || "approved_rejected";
    if (activeTab === "attendance") return reportTypeFilter || "daily";
    if (activeTab === "payroll") return reportTypeFilter || "summary";
    if (activeTab === "benefits") return reportTypeFilter || "deductions";
    if (activeTab === "performance") return reportTypeFilter || "summary";
    return "";
  }, [activeTab, reportTypeFilter]);

  const buildParams = useCallback(
    (page = 1) => {
      const base: any = {
        reportType: getReportType(),
        department: departmentFilter || undefined,
        search: search || undefined,
        page,
        limit: pageSize,
      };
      if (activeTab === "payroll") {
        base.status = statusFilter || undefined;
        base.cutoffStart = dateFrom || undefined;
        base.cutoffEnd = dateTo || undefined;
        base.startDate = dateFrom || undefined;
        base.endDate = dateTo || undefined;
      } else if (activeTab === "benefits") {
        base.status = statusFilter || undefined;
      } else {
        base.status = statusFilter || undefined;
        base.startDate = dateFrom || undefined;
        base.endDate = dateTo || undefined;
      }
      return base;
    },
    [
      getReportType,
      statusFilter,
      departmentFilter,
      dateFrom,
      dateTo,
      search,
      activeTab,
      pageSize,
    ],
  );

  const fetchData = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = buildParams(page);
        let result;
        if (activeTab === "employees") result = await getEmployeeReport(params);
        else if (activeTab === "leaves") result = await getLeaveReport(params);
        else if (activeTab === "attendance")
          result = await getAttendanceReport(params);
        else if (activeTab === "payroll")
          result = await getPayrollReport(params);
        else if (activeTab === "benefits")
          result = await getBenefitsReport(params);
        else result = await getPerformanceReport(params);
        setData(Array.isArray(result?.data) ? result.data : []);
        setPagination(
          result?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
        );
      } catch (error) {
        console.error("Report fetch error:", error);
        toast.error("Failed to load report data");
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, buildParams],
  );

  useEffect(() => {
    fetchData(1);
  }, [activeTab, reportTypeFilter]);

  const handleSearch = () => fetchData(1);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDepartmentFilter("");
    setDateFrom("");
    setDateTo("");
    setReportTypeFilter("");
  };

  const employeeReportOptions = [
    { value: "master_list", label: "Master List" },
    { value: "active", label: "Active Employees" },
    { value: "inactive", label: "Inactive Employees" },
    { value: "new_hires", label: "New Hires" },
    { value: "resigned_terminated", label: "Resigned/Terminated" },
  ];

  const leaveReportOptions = [
    { value: "approved_rejected", label: "Approved/Rejected Leaves" },
    { value: "balance", label: "Leave Balance" },
    { value: "usage", label: "Leave Usage" },
    { value: "conversion", label: "Leave Conversion" },
  ];

  const attendanceReportOptions = [
    { value: "daily", label: "Daily Attendance" },
    { value: "late", label: "Late Employees" },
    { value: "absent", label: "Absent Employees" },
    { value: "monthly_summary", label: "Monthly Summary" },
    { value: "by_branch", label: "By Branch" },
    { value: "by_department", label: "By Department" },
  ];

  const payrollReportOptions = [
    { value: "summary", label: "Payroll Summary" },
    { value: "paid", label: "Paid Payroll" },
    { value: "unpaid", label: "Unpaid Payroll" },
    { value: "by_branch", label: "By Branch" },
    { value: "by_department", label: "By Department" },
    { value: "net_pay_summary", label: "Net Pay Summary" },
    { value: "deduction_summary", label: "Deduction Summary" },
    { value: "final_pay", label: "Final Pay" },
  ];

  const benefitsReportOptions = [
    { value: "deductions", label: "All Deductions" },
    { value: "sss", label: "SSS" },
    { value: "philhealth", label: "PhilHealth" },
    { value: "pagibig", label: "Pag-IBIG" },
    { value: "tax", label: "Withholding Tax" },
    { value: "loan_other", label: "Loan & Other" },
    { value: "government", label: "Government Contributions" },
  ];

  const performanceReportOptions = [
    { value: "summary", label: "All Evaluations" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
    { value: "by_department", label: "By Department" },
    { value: "completion_rate", label: "Completion Rate" },
  ];

  const renderEmployeeTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted">
          <TableHead>Employee Code</TableHead>
          <TableHead>Employee Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Hired Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row: any) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-xs">
              {row.employee_code}
            </TableCell>
            <TableCell className="font-medium">{row.employee_name}</TableCell>
            <TableCell>{row.department}</TableCell>
            <TableCell>{row.position}</TableCell>
            <TableCell>{row.branch_name}</TableCell>
            <TableCell>
              <Badge
                variant={row.status === "ACTIVE" ? "default" : "secondary"}
                className={
                  row.status === "ACTIVE"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : row.status === "INACTIVE"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }
              >
                {row.status}
              </Badge>
            </TableCell>
            <TableCell>
              {row.hired_date ? formatDate(row.hired_date) : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderLeaveTable = () => {
    const reportType = getReportType();

    if (reportType === "balance") {
      return (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>VL (Total/Used/Avail)</TableHead>
              <TableHead>SL (Total/Used/Avail)</TableHead>
              <TableHead>EL (Total/Used/Avail)</TableHead>
              <TableHead>ML (Total/Used/Avail)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.employee_name}
                </TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell>{row.branch_name}</TableCell>
                <TableCell>
                  {row.vacation_leave}/{row.used_vacation_leave}/
                  <span className="text-green-600 font-medium">
                    {row.available_vacation}
                  </span>
                </TableCell>
                <TableCell>
                  {row.sick_leave}/{row.used_sick_leave}/
                  <span className="text-green-600 font-medium">
                    {row.available_sick}
                  </span>
                </TableCell>
                <TableCell>
                  {row.emergency_leave}/{row.used_emergency_leave}/
                  <span className="text-green-600 font-medium">
                    {row.available_emergency}
                  </span>
                </TableCell>
                <TableCell>
                  {row.maternity_leave}/{row.used_maternity_leave}/
                  <span className="text-green-600 font-medium">
                    {row.available_maternity}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (reportType === "conversion") {
      return (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Days Converted</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Conversion Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.employee_name}
                </TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell>{row.branch_name}</TableCell>
                <TableCell>{row.year}</TableCell>
                <TableCell>{row.days_converted}</TableCell>
                <TableCell>₱{formatCurrency(row.amount)}</TableCell>
                <TableCell>
                  {row.conversion_date ? formatDate(row.conversion_date) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>Employee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Branch</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.employee_name}</TableCell>
              <TableCell>{formatDeductionLabel(row.type)}</TableCell>
              <TableCell>{formatDate(row.from_date)}</TableCell>
              <TableCell>{formatDate(row.to_date)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    row.status === "APPROVED"
                      ? "default"
                      : row.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                  }
                  className={
                    row.status === "APPROVED"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : row.status === "REJECTED"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }
                >
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{row.branch_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderAttendanceTable = () => {
    const reportType = getReportType();

    if (reportType === "monthly_summary") {
      return (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Month</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Half Day</TableHead>
              <TableHead>On Leave</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{row.month}</TableCell>
                <TableCell>
                  <span className="text-green-600">{row.present_count}</span>
                </TableCell>
                <TableCell>
                  <span className="text-yellow-600">{row.late_count}</span>
                </TableCell>
                <TableCell>
                  <span className="text-red-600">{row.absent_count}</span>
                </TableCell>
                <TableCell>{row.half_day_count}</TableCell>
                <TableCell>{row.leave_count}</TableCell>
                <TableCell className="font-medium">
                  {row.total_records}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (reportType === "by_branch" || reportType === "by_department") {
      const labelKey =
        reportType === "by_branch" ? "branch_name" : "department";
      return (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>
                {reportType === "by_branch" ? "Branch" : "Department"}
              </TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Half Day</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{row[labelKey]}</TableCell>
                <TableCell>
                  <span className="text-green-600">{row.present_count}</span>
                </TableCell>
                <TableCell>
                  <span className="text-yellow-600">{row.late_count}</span>
                </TableCell>
                <TableCell>
                  <span className="text-red-600">{row.absent_count}</span>
                </TableCell>
                <TableCell>{row.half_day_count}</TableCell>
                <TableCell className="font-medium">
                  {row.total_records}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Branch</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.employee_name}</TableCell>
              <TableCell>{formatDate(row.date)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    row.status === "PRESENT"
                      ? "default"
                      : row.status === "LATE"
                        ? "secondary"
                        : row.status === "ABSENT"
                          ? "destructive"
                          : "outline"
                  }
                  className={
                    row.status === "PRESENT"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : row.status === "LATE"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : row.status === "ABSENT"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : row.status === "HALF_DAY"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  }
                >
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {row.check_in_time ? formatTime(row.check_in_time) : "-"}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {row.check_out_time ? formatTime(row.check_out_time) : "-"}
              </TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{row.branch_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderPayrollTable = () => {
    const rt = getReportType();
    if (rt === "by_branch" || rt === "by_department") {
      const labelKey = rt === "by_branch" ? "branch_name" : "department";
      return (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>
                {rt === "by_branch" ? "Branch" : "Department"}
              </TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead className="text-right">Basic Salary</TableHead>
              <TableHead className="text-right">Overtime</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Salary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{row[labelKey]}</TableCell>
                <TableCell className="text-right">
                  {row.total_employees}
                </TableCell>
                <TableCell className="text-right">
                  ₱{formatCurrency(row.total_basic_salary)}
                </TableCell>
                <TableCell className="text-right">
                  ₱{formatCurrency(row.total_overtime)}
                </TableCell>
                <TableCell className="text-right">
                  ₱{formatCurrency(row.total_deductions)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ₱{formatCurrency(row.total_net_salary)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    if (rt === "deduction_summary") {
      return (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Cutoff Start</TableHead>
              <TableHead>Cutoff End</TableHead>
              <TableHead className="text-right">Total Deductions</TableHead>
              <TableHead className="text-right">Late Deduction</TableHead>
              <TableHead className="text-right">Gov. Deduction</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.employee_name}
                </TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell>{row.branch_name}</TableCell>
                <TableCell>{formatDate(row.cutoff_start)}</TableCell>
                <TableCell>{formatDate(row.cutoff_end)}</TableCell>
                <TableCell className="text-right">
                  ₱{formatCurrency(row.total_deductions)}
                </TableCell>
                <TableCell className="text-right">
                  ₱{formatCurrency(row.late_deduction)}
                </TableCell>
                <TableCell className="text-right">
                  ₱{formatCurrency(row.government_deduction)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      row.status === "PAID"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }
                  >
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    if (rt === "final_pay") {
      return (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.employee_name}
                </TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell>{row.branch_name}</TableCell>
                <TableCell className="text-right">
                  ₱{formatCurrency(row.total_amount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row.fp_status === "APPROVED" ? "default" : "secondary"
                    }
                    className={
                      row.fp_status === "APPROVED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : ""
                    }
                  >
                    {row.fp_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {row.processed_at ? formatDate(row.processed_at) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Cutoff Start</TableHead>
            <TableHead>Cutoff End</TableHead>
            <TableHead className="text-right">Basic Salary</TableHead>
            <TableHead className="text-right">Overtime</TableHead>
            <TableHead className="text-right">Deductions</TableHead>
            <TableHead className="text-right">Net Salary</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.employee_name}</TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{row.branch_name}</TableCell>
              <TableCell>{formatDate(row.cutoff_start)}</TableCell>
              <TableCell>{formatDate(row.cutoff_end)}</TableCell>
              <TableCell className="text-right">
                ₱{formatCurrency(row.basic_salary)}
              </TableCell>
              <TableCell className="text-right">
                ₱{formatCurrency(row.overtime_pay)}
              </TableCell>
              <TableCell className="text-right">
                ₱{formatCurrency(row.deductions)}
              </TableCell>
              <TableCell className="text-right font-medium">
                ₱{formatCurrency(row.net_salary)}
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    row.status === "PAID"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }
                >
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderBenefitsTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted">
          <TableHead>Employee</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Deduction Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row: any) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.employee_name}</TableCell>
            <TableCell>{row.department}</TableCell>
            <TableCell>{row.branch_name}</TableCell>
            <TableCell>{formatDeductionLabel(row.type)}</TableCell>
            <TableCell className="text-right">
              ₱{formatCurrency(row.amount)}
            </TableCell>
            <TableCell>
              <Badge
                variant={row.is_active ? "default" : "secondary"}
                className={
                  row.is_active
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                }
              >
                {row.is_active ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderPerformanceTable = () => {
    const rt = getReportType();
    if (rt === "by_department") {
      return (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Total Evaluations</TableHead>
              <TableHead className="text-right">Avg Score</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead className="text-right">Pending</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{row.department}</TableCell>
                <TableCell className="text-right">
                  {row.total_evaluations}
                </TableCell>
                <TableCell className="text-right">
                  {Number(row.avg_score).toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-green-600">{row.completed_count}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-yellow-600">{row.pending_count}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    if (rt === "completion_rate") {
      const r = data[0] || {};
      return (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 p-4">
          {[
            {
              label: "Total Evaluations",
              value: r.total_evaluations,
              color: "",
            },
            {
              label: "Completed",
              value: r.completed_count,
              color: "text-green-600",
            },
            {
              label: "Submitted",
              value: r.submitted_count,
              color: "text-blue-600",
            },
            {
              label: "In Progress",
              value: r.in_progress_count,
              color: "text-yellow-600",
            },
            { label: "Draft", value: r.draft_count, color: "text-gray-600" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border p-4 text-center">
              <p className={`text-2xl font-bold ${item.color || ""}`}>
                {item.value ?? "-"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
          <div className="rounded-lg border p-4 text-center col-span-full">
            <p className="text-3xl font-bold text-primary">
              {r.completion_rate ?? 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Completion Rate
            </p>
          </div>
        </div>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Period Start</TableHead>
            <TableHead>Period End</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead>Evaluator</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.employee_name}</TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{row.branch_name}</TableCell>
              <TableCell>{row.template_name || "-"}</TableCell>
              <TableCell>{formatDate(row.evaluation_period_start)}</TableCell>
              <TableCell>{formatDate(row.evaluation_period_end)}</TableCell>
              <TableCell className="text-right">
                {row.final_score ?? "-"}
              </TableCell>
              <TableCell>{row.evaluator_name || "-"}</TableCell>
              <TableCell>
                <Badge
                  className={
                    row.status === "Approved"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : row.status === "Submitted"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }
                >
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderFilters = () => {
    const reportType = getReportType();
    const isEmployeeTab = activeTab === "employees";
    const isLeaveTab = activeTab === "leaves";
    const isAttendanceTab = activeTab === "attendance";
    const isPayrollTab = activeTab === "payroll";
    const isBenefitsTab = activeTab === "benefits";
    const isPerformanceTab = activeTab === "performance";

    return (
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-50">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-8"
            />
          </div>
        </div>

        {(isEmployeeTab ||
          isAttendanceTab ||
          isPayrollTab ||
          isPerformanceTab) && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-35">
              <SelectValue
                placeholder={
                  isPayrollTab
                    ? "Pay Status"
                    : isPerformanceTab
                      ? "Eval Status"
                      : isAttendanceTab
                        ? "Att. Status"
                        : "Status"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All</SelectItem>
              {isPayrollTab ? (
                <>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </>
              ) : isPerformanceTab ? (
                <>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </>
              ) : isAttendanceTab ? (
                <>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="HALF_DAY">Half Day</SelectItem>
                  <SelectItem value="LEAVE">On Leave</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="RESIGNED">Resigned</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        )}

        {isBenefitsTab && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-35">
              <SelectValue placeholder="Active Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        )}

        {(isLeaveTab ||
          isAttendanceTab ||
          isPayrollTab ||
          isPerformanceTab) && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">
                {isPayrollTab ? "Cutoff From" : "From"}
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-37.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">
                {isPayrollTab ? "To" : "To"}
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-37.5"
              />
            </div>
          </>
        )}

        {isEmployeeTab && reportType === "new_hires" && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-37.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-37.5"
              />
            </div>
          </>
        )}

        <Button variant="default" size="sm" onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={resetFilters}
          title="Reset Filters"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate, filter, and export official HR reports
          </p>
        </div>
      </div>

      {/* Tabs Navigation - Updated to match Settings tab styling */}
      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          setActiveTab(tab);
          setReportTypeFilter("");
        }}
        className="gap-0"
      >
        <TabsList
          className="flex flex-wrap w-full! gap-2 bg-transparent p-0! h-auto! rounded-none shadow-none border-none"
          style={{ height: "auto !important" }}
        >
          <TabsTrigger
            className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
            style={{ height: "auto", flex: "none" }}
            value="employees"
          >
            Employee
          </TabsTrigger>
          <TabsTrigger
            className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
            style={{ height: "auto", flex: "none" }}
            value="leaves"
          >
            Leave
          </TabsTrigger>
          <TabsTrigger
            className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
            style={{ height: "auto", flex: "none" }}
            value="attendance"
          >
            Attendance
          </TabsTrigger>
          {hasPermission("reports.payroll") && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="payroll"
            >
              Payroll
            </TabsTrigger>
          )}
          <TabsTrigger
            className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
            style={{ height: "auto", flex: "none" }}
            value="benefits"
          >
            Benefits
          </TabsTrigger>
          <TabsTrigger
            className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
            style={{ height: "auto", flex: "none" }}
            value="performance"
          >
            Performance
          </TabsTrigger>
        </TabsList>

        <div style={{ marginTop: "24px" }}>
          <TabsContent value="employees" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    Employee Reports
                  </CardTitle>
                  <Select
                    value={reportTypeFilter}
                    onValueChange={(v) => {
                      setReportTypeFilter(v);
                      setData([]);
                    }}
                  >
                    <SelectTrigger className="w-45">
                      <SelectValue placeholder="Select report" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeReportOptions.map((opt: any) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {renderFilters()}
                      <ExportButton
                        reportCategory={activeTab}
                        reportType={getReportType()}
                        filters={{
                          status: statusFilter || undefined,
                          department: departmentFilter || undefined,
                          cutoffStart:
                            activeTab === "payroll"
                              ? dateFrom || undefined
                              : undefined,
                          cutoffEnd:
                            activeTab === "payroll"
                              ? dateTo || undefined
                              : undefined,
                          startDate:
                            activeTab !== "payroll"
                              ? dateFrom || undefined
                              : undefined,
                          endDate:
                            activeTab !== "payroll"
                              ? dateTo || undefined
                              : undefined,
                          search: search || undefined,
                        }}
                        disabled={rows.length === 0}
                      />
                    </div>
                  </CardContent>
                </Card>

                {loading ? (
                  <Loader message={`Loading ${activeTab} report...`} />
                ) : rows.length === 0 ? (
                  <EmptyState
                    message={`No ${activeTab} report data found. Select a report type and adjust filters.`}
                  />
                ) : (
                  <div className="rounded-md border">
                    {renderEmployeeTable()}
                  </div>
                )}

                {rows.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Rows per page:
                      </span>
                      <select
                        value={pageSize}
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
                      Showing {startRow} to {endRow} of {totalRecords} entries
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
          </TabsContent>

          <TabsContent value="leaves" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    Leave Reports
                  </CardTitle>
                  <Select
                    value={reportTypeFilter}
                    onValueChange={(v) => {
                      setReportTypeFilter(v);
                      setData([]);
                    }}
                  >
                    <SelectTrigger className="w-45">
                      <SelectValue placeholder="Select report" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveReportOptions.map((opt: any) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {renderFilters()}
                      <ExportButton
                        reportCategory={activeTab}
                        reportType={getReportType()}
                        filters={{
                          status: statusFilter || undefined,
                          department: departmentFilter || undefined,
                          cutoffStart:
                            activeTab === "payroll"
                              ? dateFrom || undefined
                              : undefined,
                          cutoffEnd:
                            activeTab === "payroll"
                              ? dateTo || undefined
                              : undefined,
                          startDate:
                            activeTab !== "payroll"
                              ? dateFrom || undefined
                              : undefined,
                          endDate:
                            activeTab !== "payroll"
                              ? dateTo || undefined
                              : undefined,
                          search: search || undefined,
                        }}
                        disabled={rows.length === 0}
                      />
                    </div>
                  </CardContent>
                </Card>

                {loading ? (
                  <Loader message={`Loading ${activeTab} report...`} />
                ) : rows.length === 0 ? (
                  <EmptyState
                    message={`No ${activeTab} report data found. Select a report type and adjust filters.`}
                  />
                ) : (
                  <div className="rounded-md border">{renderLeaveTable()}</div>
                )}

                {rows.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Rows per page:
                      </span>
                      <select
                        value={pageSize}
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
                      Showing {startRow} to {endRow} of {totalRecords} entries
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
          </TabsContent>

          <TabsContent value="attendance" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    Attendance Reports
                  </CardTitle>
                  <Select
                    value={reportTypeFilter}
                    onValueChange={(v) => {
                      setReportTypeFilter(v);
                      setData([]);
                    }}
                  >
                    <SelectTrigger className="w-45">
                      <SelectValue placeholder="Select report" />
                    </SelectTrigger>
                    <SelectContent>
                      {attendanceReportOptions.map((opt: any) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {renderFilters()}
                      <ExportButton
                        reportCategory={activeTab}
                        reportType={getReportType()}
                        filters={{
                          status: statusFilter || undefined,
                          department: departmentFilter || undefined,
                          cutoffStart:
                            activeTab === "payroll"
                              ? dateFrom || undefined
                              : undefined,
                          cutoffEnd:
                            activeTab === "payroll"
                              ? dateTo || undefined
                              : undefined,
                          startDate:
                            activeTab !== "payroll"
                              ? dateFrom || undefined
                              : undefined,
                          endDate:
                            activeTab !== "payroll"
                              ? dateTo || undefined
                              : undefined,
                          search: search || undefined,
                        }}
                        disabled={rows.length === 0}
                      />
                    </div>
                  </CardContent>
                </Card>

                {loading ? (
                  <Loader message={`Loading ${activeTab} report...`} />
                ) : rows.length === 0 ? (
                  <EmptyState
                    message={`No ${activeTab} report data found. Select a report type and adjust filters.`}
                  />
                ) : (
                  <div className="rounded-md border">
                    {renderAttendanceTable()}
                  </div>
                )}

                {rows.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Rows per page:
                      </span>
                      <select
                        value={pageSize}
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
                      Showing {startRow} to {endRow} of {totalRecords} entries
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
          </TabsContent>

          {hasPermission("reports.payroll") && (
            <TabsContent value="payroll" className="mt-0">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-semibold">
                      Payroll Reports
                    </CardTitle>
                    <Select
                      value={reportTypeFilter}
                      onValueChange={(v) => {
                        setReportTypeFilter(v);
                        setData([]);
                      }}
                    >
                      <SelectTrigger className="w-45">
                        <SelectValue placeholder="Select report" />
                      </SelectTrigger>
                      <SelectContent>
                        {payrollReportOptions.map((opt: any) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center gap-4">
                        {renderFilters()}
                        <ExportButton
                          reportCategory={activeTab}
                          reportType={getReportType()}
                          filters={{
                            status: statusFilter || undefined,
                            department: departmentFilter || undefined,
                            cutoffStart:
                              activeTab === "payroll"
                                ? dateFrom || undefined
                                : undefined,
                            cutoffEnd:
                              activeTab === "payroll"
                                ? dateTo || undefined
                                : undefined,
                            startDate:
                              activeTab !== "payroll"
                                ? dateFrom || undefined
                                : undefined,
                            endDate:
                              activeTab !== "payroll"
                                ? dateTo || undefined
                                : undefined,
                            search: search || undefined,
                          }}
                          disabled={rows.length === 0}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {loading ? (
                    <Loader message={`Loading ${activeTab} report...`} />
                  ) : rows.length === 0 ? (
                    <EmptyState
                      message={`No ${activeTab} report data found. Select a report type and adjust filters.`}
                    />
                  ) : (
                    <div className="rounded-md border">
                      {renderPayrollTable()}
                    </div>
                  )}

                  {rows.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Rows per page:
                        </span>
                        <select
                          value={pageSize}
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
                        Showing {startRow} to {endRow} of {totalRecords} entries
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
                            variant={
                              currentPage === page ? "default" : "outline"
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
            </TabsContent>
          )}

          <TabsContent value="benefits" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    Benefits Reports
                  </CardTitle>
                  <Select
                    value={reportTypeFilter}
                    onValueChange={(v) => {
                      setReportTypeFilter(v);
                      setData([]);
                    }}
                  >
                    <SelectTrigger className="w-45">
                      <SelectValue placeholder="Select report" />
                    </SelectTrigger>
                    <SelectContent>
                      {benefitsReportOptions.map((opt: any) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {renderFilters()}
                      <ExportButton
                        reportCategory={activeTab}
                        reportType={getReportType()}
                        filters={{
                          status: statusFilter || undefined,
                          department: departmentFilter || undefined,
                          cutoffStart:
                            activeTab === "payroll"
                              ? dateFrom || undefined
                              : undefined,
                          cutoffEnd:
                            activeTab === "payroll"
                              ? dateTo || undefined
                              : undefined,
                          startDate:
                            activeTab !== "payroll"
                              ? dateFrom || undefined
                              : undefined,
                          endDate:
                            activeTab !== "payroll"
                              ? dateTo || undefined
                              : undefined,
                          search: search || undefined,
                        }}
                        disabled={rows.length === 0}
                      />
                    </div>
                  </CardContent>
                </Card>

                {loading ? (
                  <Loader message={`Loading ${activeTab} report...`} />
                ) : rows.length === 0 ? (
                  <EmptyState
                    message={`No ${activeTab} report data found. Select a report type and adjust filters.`}
                  />
                ) : (
                  <div className="rounded-md border">
                    {renderBenefitsTable()}
                  </div>
                )}

                {rows.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Rows per page:
                      </span>
                      <select
                        value={pageSize}
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
                      Showing {startRow} to {endRow} of {totalRecords} entries
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
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    Performance Reports
                  </CardTitle>
                  <Select
                    value={reportTypeFilter}
                    onValueChange={(v) => {
                      setReportTypeFilter(v);
                      setData([]);
                    }}
                  >
                    <SelectTrigger className="w-45">
                      <SelectValue placeholder="Select report" />
                    </SelectTrigger>
                    <SelectContent>
                      {performanceReportOptions.map((opt: any) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {renderFilters()}
                      <ExportButton
                        reportCategory={activeTab}
                        reportType={getReportType()}
                        filters={{
                          status: statusFilter || undefined,
                          department: departmentFilter || undefined,
                          cutoffStart:
                            activeTab === "payroll"
                              ? dateFrom || undefined
                              : undefined,
                          cutoffEnd:
                            activeTab === "payroll"
                              ? dateTo || undefined
                              : undefined,
                          startDate:
                            activeTab !== "payroll"
                              ? dateFrom || undefined
                              : undefined,
                          endDate:
                            activeTab !== "payroll"
                              ? dateTo || undefined
                              : undefined,
                          search: search || undefined,
                        }}
                        disabled={rows.length === 0}
                      />
                    </div>
                  </CardContent>
                </Card>

                {loading ? (
                  <Loader message={`Loading ${activeTab} report...`} />
                ) : rows.length === 0 ? (
                  <EmptyState
                    message={`No ${activeTab} report data found. Select a report type and adjust filters.`}
                  />
                ) : (
                  <div className="rounded-md border">
                    {renderPerformanceTable()}
                  </div>
                )}

                {rows.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Rows per page:
                      </span>
                      <select
                        value={pageSize}
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
                      Showing {startRow} to {endRow} of {totalRecords} entries
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
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
