import { useEffect, useState, useCallback } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getDrillDownAttendance,
  getDrillDownPayroll,
  getDrillDownOvertime,
  getDrillDownLeaves,
  getDrillDownAnomalies,
  getDrillDownBranches,
  exportDrillDown,
} from "@/services/drilldownService";
import type { DrillDownParams } from "@/services/drilldownService";

const FETCHERS: Record<string, (params?: DrillDownParams) => Promise<any>> = {
  attendance: getDrillDownAttendance,
  payroll: getDrillDownPayroll,
  overtime: getDrillDownOvertime,
  leaves: getDrillDownLeaves,
  anomalies: getDrillDownAnomalies,
  branches: getDrillDownBranches,
};

const COLUMNS: Record<string, { key: string; label: string }[]> = {
  attendance: [
    { key: "employee_name", label: "Employee" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "check_in_time", label: "Check In" },
    { key: "check_out_time", label: "Check Out" },
    { key: "branch_name", label: "Branch" },
  ],
  payroll: [
    { key: "employee_name", label: "Employee" },
    { key: "cutoff_start", label: "Cutoff Start" },
    { key: "cutoff_end", label: "Cutoff End" },
    { key: "net_salary", label: "Net Salary" },
    { key: "status", label: "Status" },
    { key: "branch_name", label: "Branch" },
  ],
  overtime: [
    { key: "employee_name", label: "Employee" },
    { key: "date", label: "Date" },
    { key: "hours", label: "Hours" },
    { key: "status", label: "Status" },
    { key: "reason", label: "Reason" },
    { key: "branch_name", label: "Branch" },
  ],
  leaves: [
    { key: "employee_name", label: "Employee" },
    { key: "type", label: "Type" },
    { key: "from_date", label: "From" },
    { key: "to_date", label: "To" },
    { key: "status", label: "Status" },
    { key: "reason", label: "Reason" },
  ],
  anomalies: [
    { key: "employee_name", label: "Employee" },
    { key: "anomaly_type", label: "Type" },
    { key: "severity", label: "Severity" },
    { key: "title", label: "Title" },
    { key: "detected_at", label: "Detected" },
    { key: "status", label: "Status" },
  ],
  branches: [
    { key: "branch_name", label: "Branch" },
    { key: "present", label: "Present" },
    { key: "late", label: "Late" },
    { key: "absent", label: "Absent" },
    { key: "on_leave", label: "On Leave" },
    { key: "total", label: "Total" },
  ],
};

interface DrilldownDrawerProps {
  open: boolean;
  onClose: () => void;
  module: string;
  title?: string;
  defaultParams?: DrillDownParams;
}

const DrilldownDrawer = ({ open, onClose, module, title, defaultParams }: DrilldownDrawerProps) => {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetcher = FETCHERS[module];
  const columns = COLUMNS[module] || [];

  const fetchData = useCallback(async (page: number) => {
    if (!fetcher) return;
    setLoading(true);
    try {
      const result = await fetcher({ ...defaultParams, page, limit: 20 });
      setData(result.data);
      setPagination(result.pagination);
    } catch (err) {
      console.error(`[DrilldownDrawer] ${module} error:`, err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetcher, module, defaultParams]);

  useEffect(() => {
    if (open) fetchData(1);
  }, [open, fetchData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportDrillDown({ ...defaultParams, module });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${module}_drilldown_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[DrilldownDrawer] export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const formatValue = (row: any, key: string) => {
    const v = row[key];
    if (v === null || v === undefined) return "—";
    if (key === "net_salary") return `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (key === "hours") return `${Number(v).toFixed(1)}h`;
    if ((key === "check_in_time" || key === "check_out_time" || key === "detected_at") && v) {
      return new Date(v).toLocaleString();
    }
    if ((key === "date" || key === "from_date" || key === "to_date" || key === "cutoff_start" || key === "cutoff_end") && v) {
      return new Date(v).toLocaleDateString();
    }
    return String(v);
  };

  const severityColor = (s: string) => {
    if (s === "HIGH") return "text-red-600 font-medium";
    if (s === "MEDIUM") return "text-yellow-600 font-medium";
    return "text-muted-foreground";
  };

  return (
    <Drawer open={open} onClose={onClose} direction="right">
      <DrawerContent className="max-w-3xl">
        <DrawerHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>{title || `${module.charAt(0).toUpperCase() + module.slice(1)} Drill-Down`}</DrawerTitle>
              <DrawerDescription>
                {pagination.total} records found
              </DrawerDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || data.length === 0}>
                <Download className="h-4 w-4 mr-1" />
                {exporting ? "Exporting..." : "CSV"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">No data found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={row.id || i}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.key === "severity" ? severityColor(row[col.key]) : ""}>
                        {formatValue(row, col.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        {pagination.totalPages > 1 && (
          <div className="border-t border-border/50 p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchData(pagination.page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default DrilldownDrawer;
