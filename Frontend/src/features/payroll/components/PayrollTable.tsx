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
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { formatCurrency } from "@/utils/formatCurrency";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/shared/TablePagination";
import {
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import { markPayrollAsPaid, downloadPayslip } from "@/services/payrollService";
import { toast } from "sonner";
import { useState } from "react";
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
import EmptyState from "@/components/shared/EmptyState";

interface PayrollRecord {
  id: number;
  payroll_id?: number | null;
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
  total_allowances?: number;
  withholding_tax?: number;
  branch_id?: number | null;
  branch_name?: string | null;
}

interface PayrollTableProps {
  data: PayrollRecord[];
  onViewDetails?: (record: PayrollRecord) => void;
  onRefresh?: () => void;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

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
  const [markPaidTarget, setMarkPaidTarget] = useState<number | null>(null);

  const handleMarkPaid = async (payrollId: number) => {
    try {
      await markPayrollAsPaid(payrollId);
      toast.success("Marked as paid");
      onRefresh?.();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDownloadPayslip = async (record: PayrollRecord) => {
    const payrollId = record.payroll_id;
    if (!payrollId) {
      toast.error("Payroll not generated yet");
      return;
    }
    try {
      setDownloadingId(payrollId);
      const blob = await downloadPayslip(payrollId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${record.employee_code}-${payrollId}.pdf`;
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>Employee Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Basic Salary</TableHead>
            <TableHead>Overtime</TableHead>
            <TableHead>Leave Conv.</TableHead>
            <TableHead>Deductions</TableHead>
            <TableHead>Net Salary</TableHead>
            <TableHead>Allowances</TableHead>
            <TableHead>Withholding Tax</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length > 0 ? (
            data.map((record) => (
              <TableRow key={record.payroll_id ?? `emp-${record.id}`}>
                <TableCell className="font-medium">
                  {record.employee_code}
                </TableCell>
                <TableCell>{formatEmployeeName(record)}</TableCell>
                <TableCell>
                  {record.branch_name || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
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
                <TableCell className="text-purple-600">
                  {record.total_allowances != null && record.total_allowances > 0
                    ? `+₱${formatCurrency(record.total_allowances)}`
                    : "—"}
                </TableCell>
                <TableCell className="text-red-600">
                  {record.withholding_tax != null && record.withholding_tax > 0
                    ? `-₱${formatCurrency(record.withholding_tax)}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={record.status === "PAID" ? "default" : "secondary"}
                    className={
                      record.status === "PAID"
                        ? getStatusBadgeClass("success")
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
                      disabled={!record.payroll_id || downloadingId === record.payroll_id}
                    >
                      {downloadingId === record.payroll_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      disabled={
                        !record.payroll_id || record.status === "PAID"
                      }
                      onClick={() => setMarkPaidTarget(record.payroll_id!)}
                    >
                      Mark Paid
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={12} className="text-center py-8">
                <EmptyState message="No payroll records found" />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data.length > 0 && (
        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={totalRecords}
          pageSize={rowsPerPage}
          onPageChange={onPageChange}
          onPageSizeChange={(size) => { onRowsPerPageChange(size); onPageChange(1); }}
        />
      )}

      <AlertDialog open={markPaidTarget !== null} onOpenChange={() => setMarkPaidTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Payroll as Paid</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The employee&apos;s payroll will be marked as PAID.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (markPaidTarget) handleMarkPaid(markPaidTarget); setMarkPaidTarget(null); }}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PayrollTable;
