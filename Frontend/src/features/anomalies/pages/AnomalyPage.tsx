import { useEffect, useState, useCallback } from "react";
import {
  getAnomalies,
  getAnomalySummary,
  updateAnomalyStatus,
  runDailyScan,
} from "@/services/anomalyService";
import type { Anomaly, AnomalySummary as AnomalySummaryType } from "@/services/anomalyService";
import { formatDateShort } from "@/utils/formatDate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import AnomalyDetailDrawer from "../components/AnomalyDetailDrawer";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Activity,
  FileText,
  RefreshCw,
  Scan,
  Eye,
  Search,
} from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";

const severityConfig: Record<string, { label: string; variant: "destructive" | "default" | "secondary" }> = {
  HIGH: { label: "HIGH", variant: "destructive" },
  MEDIUM: { label: "MEDIUM", variant: "default" },
  LOW: { label: "LOW", variant: "secondary" },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  OPEN: { label: "Open", variant: "default" },
  REVIEWED: { label: "Reviewed", variant: "secondary" },
  RESOLVED: { label: "Resolved", variant: "outline" },
};

const ANOMALY_TYPE_LABELS: Record<string, string> = {
  REPEATED_LATE: "Repeated Late",
  EXCESSIVE_OVERTIME: "Excessive Overtime",
  ABSENT_WITHOUT_LEAVE: "Absent w/o Leave",
  OVERTIME_SPIKE: "Overtime Spike",
  PAYROLL_SPIKE: "Payroll Spike",
  REPEATED_TIME_MODIFICATION: "Repeated Time Mod",
  FREQUENT_UNDERTIME: "Frequent Undertime",
  CHECKOUT_WITHOUT_CHECKIN: "Checkout No Checkin",
  REPEATED_MISSING_CHECKOUT: "Missing Checkout",
  ABNORMAL_LEAVE_FREQUENCY: "Abnormal Leave",
  BRANCH_HIGH_ABSENCE: "Branch High Absence",
  REJECTED_LEAVE_FOLLOWED_BY_ABSENCE: "Rejected Leave→Absence",
  LEAVE_AROUND_ABSENCE: "Leave Around Absence",
  REJECTED_OVERTIME_REPEATED: "Rejected OT Repeated",
  MANHOUR_OVERLAP: "Man-hour Overlap",
  MANHOUR_EXCEEDS_EXPECTED: "Man-hour Excess",
  MANHOUR_REPEATED_EDITS: "Man-hour Edits",
  REJECTED_TIME_MODIFICATION_REPEATED: "Rejected Time Mod",
};

const AnomalyPage = () => {
  const { user } = useAuth();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [summary, setSummary] = useState<AnomalySummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const rowsPerPage = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Detail drawer
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAdminLevel = user?.role === "ADMIN";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const normalizeFilter = (v: string) => (!v || v === "all" ? undefined : v);
      const [anomalyData, summaryData] = await Promise.all([
        getAnomalies({
          page,
          limit: rowsPerPage,
          status: normalizeFilter(statusFilter),
          severity: normalizeFilter(severityFilter),
          anomaly_type: normalizeFilter(typeFilter),
          source_module: normalizeFilter(moduleFilter),
          employee_id: searchTerm || undefined,
        }),
        getAnomalySummary(),
      ]);
      setAnomalies(anomalyData.data);
      setTotalPages(anomalyData.pagination.totalPages);
      setTotalRecords(anomalyData.pagination.total);
      setSummary(summaryData);
    } catch {
      toast.error("Failed to load anomalies");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, severityFilter, typeFilter, moduleFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunScan = async () => {
    if (!isAdminLevel) return;
    setScanning(true);
    try {
      const result = await runDailyScan();
      toast.success(`Scan complete: ${result.results.total_detected} anomalies detected`);
      fetchData();
    } catch {
      toast.error("Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleQuickStatus = async (id: number, status: "REVIEWED" | "RESOLVED") => {
    try {
      await updateAnomalyStatus(id, status);
      toast.success(`Anomaly #${id} marked as ${status.toLowerCase()}`);
      fetchData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const openDetail = (id: number) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };



  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-muted-foreground">Anomaly Detection</h1>
            <p className="text-sm text-muted-foreground">
              Rule-based detection of suspicious HR and attendance activity
            </p>
          </div>
        </div>
        {isAdminLevel && (
          <Button
            variant="outline"
            onClick={handleRunScan}
            disabled={scanning}
            className="flex items-center gap-2 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground disabled:text-muted-foreground disabled:opacity-50 disabled:pointer-events-none"
          >
            <Scan className={`h-4 w-4 text-current ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning..." : "Run Daily Scan"}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-linear-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Anomalies</p>
                  <h2 className="text-3xl font-bold">{summary.open_count}</h2>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-linear-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Severity</p>
                  <h2 className="text-3xl font-bold">{summary.high_severity_count}</h2>
                </div>
                <ShieldAlert className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-linear-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Detected Today</p>
                  <h2 className="text-3xl font-bold">{summary.today_detected_count}</h2>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-linear-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <h2 className="text-3xl font-bold">{summary.resolved_count}</h2>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Anomaly Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="w-40">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="LOW">LOW</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="overtime">Overtime</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="leaves">Leaves</SelectItem>
                  <SelectItem value="man_hours">Man Hours</SelectItem>
                  <SelectItem value="time_modification">Time Modification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(ANOMALY_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee ID..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Button variant="ghost" onClick={() => { fetchData(); }} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Detected</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Loader message="Loading anomalies..." />
                    </TableCell>
                  </TableRow>
                ) : anomalies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyState message="No anomalies found" />
                    </TableCell>
                  </TableRow>
                ) : (
                  anomalies.map((a) => {
                    const SevBadge = severityConfig[a.severity];
                    const StaBadge = statusConfig[a.status];
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs">#{a.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{a.employee_name}</p>
                            <p className="text-xs text-muted-foreground">{a.employee_code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium">
                            {ANOMALY_TYPE_LABELS[a.anomaly_type] || a.anomaly_type.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={SevBadge.variant}>{SevBadge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={StaBadge.variant}>{StaBadge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs capitalize">
                          {a.source_module.replace("_", " ")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDateShort(a.detected_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDetail(a.id)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {a.status === "OPEN" && isAdminLevel && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleQuickStatus(a.id, "REVIEWED")}
                                  title="Mark Reviewed"
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleQuickStatus(a.id, "RESOLVED")}
                                  title="Mark Resolved"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalRecords}
            pageSize={rowsPerPage}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
            showPageSize={false}
            itemLabel="records"
          />
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <AnomalyDetailDrawer
        anomalyId={selectedId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusUpdate={fetchData}
      />
    </div>
  );
};

export default AnomalyPage;
