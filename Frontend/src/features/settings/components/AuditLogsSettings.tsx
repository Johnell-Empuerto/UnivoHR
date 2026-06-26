"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TablePagination } from "@/components/shared/TablePagination";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { getAuditLogs, type AuditLog } from "@/services/auditLogService";
import { formatDateShort } from "@/utils/formatDate";
import {
  History,
  Search,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";

const ACTION_OPTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "APPROVE",
  "REJECT",
  "UPLOAD",
  "DOWNLOAD",
  "VIEW",
];

const TABLE_OPTIONS = [
  "users",
  "employees",
  "attendance",
  "leaves",
  "overtime_requests",
  "payroll",
  "branches",
  "devices",
  "audit_logs",
];

const AuditLogsSettings = () => {
  const [data, setData] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchData = async (p: number) => {
    setLoading(true);
    try {
      const res = await getAuditLogs({
        page: p,
        limit: pageSize,
        search: search || undefined,
        action: actionFilter || undefined,
        table_name: tableFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setData(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page, pageSize, search, actionFilter, tableFilter, dateFrom, dateTo]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchInput]);

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setActionFilter("");
    setTableFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleRefresh = () => {
    handleClearFilters();
    fetchData(1);
  };

  const hasFilters = searchInput || actionFilter || tableFilter || dateFrom || dateTo;

  const openDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      LOGIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
      APPROVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      REJECT: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[action] || "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300"}`}>
        {action}
      </span>
    );
  };

  const formatModule = (name: string) => {
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Audit Logs</h2>
            <p className="text-sm text-muted-foreground">
              View system activity and user actions
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, description, or IP..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v === "__all__" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Actions</SelectItem>
              {ACTION_OPTIONS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v === "__all__" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Modules</SelectItem>
              {TABLE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{formatModule(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-40"
            placeholder="From"
          />

          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-40"
            placeholder="To"
          />

          {hasFilters && (
            <Button variant="ghost" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <Loader message="Loading audit logs..." />
        ) : data.length === 0 ? (
          <EmptyState message="No audit logs found matching your criteria." />
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="whitespace-nowrap">Date / Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead className="max-w-xs">Description</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="w-16">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((log) => (
                    <TableRow key={log.id} className="border-b border-gray-400/50 dark:border-gray-400/50">
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateShort(log.created_at)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {log.username || <span className="text-muted-foreground italic">System</span>}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatModule(log.table_name)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {log.description || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {log.ip_address || "-"}
                      </TableCell>
                      <TableCell>
                        {(log.old_values || log.new_values) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openDetails(log)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              itemLabel="logs"
            />
          </>
        )}
      </CardContent>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              {selectedLog && <>Log entry #{selectedLog.id} — {formatModule(selectedLog.table_name)} / {selectedLog.action}</>}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">User:</span>{" "}
                  <span className="font-medium">{selectedLog.username || "System"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Action:</span>{" "}
                  <span className="font-medium">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Module:</span>{" "}
                  <span className="font-medium">{formatModule(selectedLog.table_name)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Record ID:</span>{" "}
                  <span className="font-medium">{selectedLog.record_id ?? "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">IP Address:</span>{" "}
                  <span className="font-medium">{selectedLog.ip_address || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  <span className="font-medium">{formatDateShort(selectedLog.created_at)}</span>
                </div>
              </div>

              {selectedLog.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{selectedLog.description}</p>
                </div>
              )}

              {selectedLog.old_values && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Old Values</h4>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">New Values</h4>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AuditLogsSettings;
