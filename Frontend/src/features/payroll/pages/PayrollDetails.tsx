// features/payroll/pages/PayrollDetails.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPayrollById, downloadPayslip } from "@/services/payrollService";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, Wallet } from "lucide-react";
import SalaryBreakdown from "../components/SalaryBreakdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatDate";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";

// Helper to format employee name from structured fields
const formatEmployeeName = (record: any) => {
  if (record.first_name && record.last_name) {
    return `${record.first_name} ${record.middle_name || ""} ${record.last_name}${record.suffix ? `, ${record.suffix}` : ""}`.trim();
  }
  return record.name || "";
};

const PayrollDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [downloading, setDownloading] = useState(false);
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("No payroll ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPayrollById(id);
        setRecord(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch payroll:", err);
        setError(err.message || "Failed to load payroll details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleExport = async () => {
    try {
      setDownloading(true);

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
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Loader message="Loading payroll data..." />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/payroll")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary dark:text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-muted-foreground">
                Payroll Details
              </h1>
              <p className="text-sm text-muted-foreground">
                View detailed salary breakdown
              </p>
            </div>
          </div>
        </div>
        <EmptyState
          message={error || "No payroll record found"}
          action={{ label: "Back to Payroll", onClick: () => navigate("/payroll") }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header - Matching consistent theme with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/payroll")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-muted-foreground">
              Payroll Details
            </h1>
            <p className="text-sm text-muted-foreground">
              View detailed salary breakdown
            </p>
          </div>
        </div>
        <div className="flex-1"></div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{formatEmployeeName(record)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employee Code</p>
              <p className="font-medium">{record.employee_code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payroll Period</p>
              <p className="font-medium">
                {record.cutoff_start && record.cutoff_end
                  ? `${formatDate(record.cutoff_start)} to ${formatDate(record.cutoff_end)}`
                  : `${record.month}/${record.year}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    record.status === "PAID"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {record.status || "UNPAID"}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Branch</p>
              <p className="font-medium">
                {record.branch_name || (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Breakdown */}
      <SalaryBreakdown record={record} />
    </div>
  );
};

export default PayrollDetails;
