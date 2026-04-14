// features/payroll/components/PayrollTable.tsx
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
import {
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { markPayrollAsPaid, downloadPayslip } from "@/services/payrollService";
import { toast } from "sonner";
import { useState } from "react";

interface PayrollRecord {
  id: number;
  employee_id: number;
  employee_code: string;
  name: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  suffix?: string;
  basic_salary: number;
  overtime_pay: number;
  leave_conversion?: number;
  deductions: number;
  net_salary: number;
  status: string;
  late_deduction?: number;
  absent_deduction?: number;
  government_deduction?: number;
}

interface PayrollTableProps {
  data: PayrollRecord[];
  onViewDetails?: (record: PayrollRecord) => void;
  onExport?: (record: PayrollRecord) => void;
  onRefresh?: () => void;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

//  CURRENCY FORMATTER - FIXES DECIMAL ISSUES
const formatCurrency = (value: number) => {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

//  Helper to format employee name
const formatEmployeeName = (record: PayrollRecord) => {
  if (record.first_name && record.last_name) {
    return `${record.first_name} ${record.middle_name || ""} ${record.last_name}${record.suffix ? `, ${record.suffix}` : ""}`.trim();
  }
  return record.name || "";
};

const PayrollTable = ({
  data,
  onViewDetails,
  onRefresh,
  currentPage,
  totalPages,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  totalRecords,
}: PayrollTableProps) => {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleMarkPaid = async (id: number) => {
    try {
      await markPayrollAsPaid(id);
      toast.success("Marked as paid");
      onRefresh?.();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDownloadPayslip = async (record: PayrollRecord) => {
    try {
      setDownloadingId(record.id);
      const blob = await downloadPayslip(record.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${record.employee_code}-${record.id}.pdf`;
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

  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalRecords);

  const goToPage = (page: number) => {
    onPageChange(Math.max(1, Math.min(page, totalPages)));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRows = Number(e.target.value);
    onRowsPerPageChange(newRows);
    onPageChange(1);
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
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>Employee Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Basic Salary</TableHead>
            <TableHead>Overtime</TableHead>
            <TableHead>Leave Conv.</TableHead>
            <TableHead>Deductions</TableHead>
            <TableHead>Net Salary</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length > 0 ? (
            data.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">
                  {record.employee_code}
                </TableCell>
                <TableCell>{formatEmployeeName(record)}</TableCell>
                <TableCell>₱{formatCurrency(record.basic_salary)}</TableCell>
                <TableCell>₱{formatCurrency(record.overtime_pay)}</TableCell>
                {/*  FIXED LEAVE CONVERSION CELL */}
                <TableCell className="text-blue-600">
                  {record.leave_conversion && record.leave_conversion > 0
                    ? `+₱${formatCurrency(record.leave_conversion)}`
                    : "—"}
                </TableCell>
                <TableCell className="text-red-600">
                  -₱{formatCurrency(record.deductions)}
                </TableCell>
                <TableCell className="font-semibold text-green-600">
                  ₱{formatCurrency(record.net_salary)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={record.status === "PAID" ? "default" : "secondary"}
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
                      onClick={() => onViewDetails?.(record)}
                      className="h-8 w-8 p-0"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPayslip(record)}
                      className="h-8 w-8 p-0"
                      title="Download Payslip"
                      disabled={downloadingId === record.id}
                    >
                      {downloadingId === record.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      disabled={record.status === "PAID"}
                      onClick={() => handleMarkPaid(record.id)}
                    >
                      Mark Paid
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center py-8 text-muted-foreground"
              >
                No payroll records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data.length > 0 && (
        <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
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
    </div>
  );
};

export default PayrollTable;
