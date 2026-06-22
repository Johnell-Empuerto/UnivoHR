"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  getRawLogs,
  getRawLogById,
  getMappings,
  createMapping,
  updateMapping,
  deleteMapping,
  getEmployeeDeviceUsers,
  createEmployeeDeviceUser,
  updateEmployeeDeviceUser,
  deleteEmployeeDeviceUser,
  searchEmployees,
} from "@/services/deviceIntegrationService";
import { getActiveBranches } from "@/services/branchService";
import type {
  Device,
  RawLog,
  DeviceLogMapping,
  EmployeeDeviceUser,
} from "@/services/deviceIntegrationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Loader from "@/components/shared/Loader";
import { TablePagination } from "@/components/shared/TablePagination";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Monitor,
  List,
  Users,
  GitBranch,
  Plus,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Server,
  Search,
  X,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function DeviceIntegration() {
  const { hasPermission } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState("devices");

  const canViewDevices = hasPermission("devices.view");
  const canManageDevices = hasPermission("devices.manage");
  const canViewLogs = hasPermission("device_logs.view");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Device Integrations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <TabsList className="flex w-full gap-2 overflow-x-auto mb-6">
            <TabsTrigger
              value="devices"
              className="flex items-center gap-2 flex-1"
              disabled={!canViewDevices}
            >
              <Monitor className="h-4 w-4" /> Devices
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="flex items-center gap-2 flex-1"
              disabled={!canViewLogs}
            >
              <List className="h-4 w-4" /> Raw Logs
            </TabsTrigger>
            <TabsTrigger
              value="device-users"
              className="flex items-center gap-2 flex-1"
              disabled={!canViewDevices}
            >
              <Users className="h-4 w-4" /> Device User Mapping
            </TabsTrigger>
            <TabsTrigger
              value="mappings"
              className="flex items-center gap-2 flex-1"
              disabled={!canViewDevices}
            >
              <GitBranch className="h-4 w-4" /> Device Log Mappings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <DevicesTab canManage={canManageDevices} />
          </TabsContent>
          <TabsContent value="logs">
            <RawLogsTab />
          </TabsContent>
          <TabsContent value="device-users">
            <DeviceUserMappingTab canManage={canManageDevices} />
          </TabsContent>
          <TabsContent value="mappings">
            <MappingsTab canManage={canManageDevices} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ─── DEVICES TAB ─────────────────────────────────────────────

function DevicesTab({ canManage }: { canManage: boolean }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [branches, setBranches] = useState<
    { id: number; name: string; timezone: string }[]
  >([]);
  const [form, setForm] = useState({
    name: "",
    type: "BIOMETRIC",
    serial_number: "",
    model: "",
    ip_address: "",
    port: "",
    location: "",
    status: "ACTIVE",
    api_key: "",
    notes: "",
    branch_id: "",
  });

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDevices({ page, limit: ITEMS_PER_PAGE, search });
      setDevices(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      toast.error("Failed to load devices");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    getActiveBranches()
      .then(setBranches)
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      type: "BIOMETRIC",
      serial_number: "",
      model: "",
      ip_address: "",
      port: "",
      location: "",
      status: "ACTIVE",
      api_key: "",
      notes: "",
      branch_id: "",
    });
    setShowDialog(true);
  };

  const openEdit = (d: Device) => {
    setEditing(d);
    setForm({
      name: d.name,
      type: d.type,
      serial_number: d.serial_number || "",
      model: d.model || "",
      ip_address: d.ip_address || "",
      port: d.port ? String(d.port) : "",
      location: d.location || "",
      status: d.status,
      api_key: d.api_key || "",
      notes: d.notes || "",
      branch_id: d.branch_id ? String(d.branch_id) : "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Device name is required");
      return;
    }
    try {
      const payload = {
        ...form,
        port: form.port ? parseInt(form.port) : null,
        branch_id: form.branch_id ? parseInt(form.branch_id) : null,
      };
      if (editing) {
        await updateDevice(editing.id, payload);
        toast.success("Device updated");
      } else {
        await createDevice(payload);
        toast.success("Device created");
      }
      setShowDialog(false);
      fetchDevices();
    } catch {
      toast.error("Failed to save device");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this device and all associated data?")) return;
    try {
      await deleteDevice(id);
      toast.success("Device deleted");
      fetchDevices();
    } catch {
      toast.error("Failed to delete device");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search devices..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-64"
          />
          <Button variant="outline" size="icon" onClick={fetchDevices}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Device
          </Button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Logs</TableHead>
                {canManage && <TableHead className="w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 8 : 7}
                    className="text-center py-8 text-muted-foreground italic"
                  >
                    No devices configured.
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((d) => (
                  <TableRow
                    key={d.id}
                    className="border-b border-gray-400/50 dark:border-gray-400/50"
                  >
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{d.type}</Badge>
                    </TableCell>
                    <TableCell>{d.ip_address || "—"}</TableCell>
                    <TableCell>{d.location || "—"}</TableCell>
                    <TableCell>
                      {d.branch_name ? (
                        <span
                          className="text-xs"
                          title={d.branch_timezone || ""}
                        >
                          {d.branch_name}
                          {d.branch_timezone ? ` (${d.branch_timezone})` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No branch assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          d.status === "ACTIVE"
                            ? "default"
                            : d.status === "OFFLINE"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {d.total_logs ?? 0} total
                        {(d.pending_logs ?? 0) > 0 && (
                          <span className="ml-1 text-amber-500">
                            ({d.pending_logs} pending)
                          </span>
                        )}
                      </span>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(d)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(d.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={ITEMS_PER_PAGE}
        showPageSize={false}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-5xl!">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Device" : "Add Device"}</DialogTitle>
            <DialogDescription>
              Configure the device connection details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <div className="col-span-2 space-y-1.5">
              <Label>Device Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Main Entrance Biometric"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BIOMETRIC">Biometric</SelectItem>
                  <SelectItem value="CARD_READER">Card Reader</SelectItem>
                  <SelectItem value="MOBILE">Mobile App</SelectItem>
                  <SelectItem value="API">API Endpoint</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Serial Number</Label>
              <Input
                value={form.serial_number}
                onChange={(e) =>
                  setForm({ ...form, serial_number: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label>IP Address</Label>
              <Input
                value={form.ip_address}
                onChange={(e) =>
                  setForm({ ...form, ip_address: e.target.value })
                }
                placeholder="e.g. 192.168.1.100"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Port</Label>
              <Input
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
                placeholder="e.g. 4370"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Main Entrance"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Select
                value={form.branch_id}
                onValueChange={(v) => setForm({ ...form, branch_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No branch assigned" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                      {b.timezone ? ` (${b.timezone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>API Key</Label>
              <Input
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                placeholder="For device authentication"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── RAW LOGS TAB ────────────────────────────────────────────

function RawLogsTab() {
  const [logs, setLogs] = useState<RawLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deviceFilter, setDeviceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);

  const [payloadDialog, setPayloadDialog] = useState(false);
  const [payloadLog, setPayloadLog] = useState<RawLog | null>(null);
  const [payloadLoading, setPayloadLoading] = useState(false);

  useEffect(() => {
    getDevices({ limit: 100 })
      .then((res) => setDevices(res.data))
      .catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRawLogs({
        page,
        limit: ITEMS_PER_PAGE,
        status: statusFilter || undefined,
        device_id:
          deviceFilter && deviceFilter !== "all"
            ? parseInt(deviceFilter)
            : undefined,
        source: sourceFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setLogs(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      toast.error("Failed to load raw logs");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, deviceFilter, sourceFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const viewPayload = async (id: number) => {
    setPayloadLoading(true);
    setPayloadDialog(true);
    try {
      const log = await getRawLogById(id);
      setPayloadLog(log);
    } catch {
      toast.error("Failed to load raw payload");
      setPayloadDialog(false);
    } finally {
      setPayloadLoading(false);
    }
  };

  const clearFilters = () => {
    setDeviceFilter("");
    setStatusFilter("");
    setSourceFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const statusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      PENDING: "outline",
      PROCESSED: "default",
      FAILED: "destructive",
      DUPLICATE: "secondary",
    };
    const colors: Record<string, string> = {
      PENDING: "",
      PROCESSED: getStatusBadgeClass("success"),
      FAILED: "",
      DUPLICATE: "",
    };
    return (
      <Badge
        variant={variants[status] || "outline"}
        className={colors[status] || ""}
      >
        {status}
      </Badge>
    );
  };

  const hasActiveFilters =
    statusFilter || deviceFilter || sourceFilter || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={deviceFilter}
            onValueChange={(v) => {
              setDeviceFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Devices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              {devices.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSED">Processed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="DUPLICATE">Duplicate</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sourceFilter}
            onValueChange={(v) => {
              setSourceFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="API">API</SelectItem>
              <SelectItem value="IMPORT">Import</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-36"
              placeholder="From"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-36"
              placeholder="To"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Device</TableHead>
                <TableHead>Employee Code</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="w-20">Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground italic"
                  >
                    No raw logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-b border-gray-400/50 dark:border-gray-400/50"
                  >
                    <TableCell>
                      {log.device_name || `Device #${log.device_id}`}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.employee_code || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.source}</Badge>
                    </TableCell>
                    <TableCell>{statusBadge(log.status)}</TableCell>
                    <TableCell className="text-xs text-red-500 max-w-[150px] truncate">
                      {log.error_message || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewPayload(log.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={ITEMS_PER_PAGE}
        showPageSize={false}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
      />

      <Dialog open={payloadDialog} onOpenChange={setPayloadDialog}>
        <DialogContent className="!max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Raw Payload</DialogTitle>
            <DialogDescription>
              Original device payload received for this log entry.
            </DialogDescription>
          </DialogHeader>
          {payloadLoading ? (
            <Loader />
          ) : (
            payloadLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Log ID:</span>{" "}
                    {payloadLog.id}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Device:</span>{" "}
                    {payloadLog.device_name ||
                      `Device #${payloadLog.device_id}`}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Employee Code:
                    </span>{" "}
                    {payloadLog.employee_code || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timestamp:</span>{" "}
                    {new Date(payloadLog.timestamp).toLocaleString()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Source:</span>{" "}
                    {payloadLog.source}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {payloadLog.status}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Raw Payload</Label>
                  <pre className="mt-1 p-4 bg-muted rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap break-all max-h-64">
                    {payloadLog.raw_payload || "No payload data"}
                  </pre>
                </div>
              </div>
            )
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayloadDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── DEVICE USER MAPPING TAB ─────────────────────────────────

function DeviceUserMappingTab({ canManage }: { canManage: boolean }) {
  const [mappings, setMappings] = useState<EmployeeDeviceUser[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<EmployeeDeviceUser | null>(null);
  const [form, setForm] = useState({
    employee_id: 0,
    device_id: "",
    device_user_id: "",
    active: true,
  });
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [empData, setEmpData] = useState<any[]>([]);
  const [empTotal, setEmpTotal] = useState(0);
  const [empPage, setEmpPage] = useState(1);
  const [empLoading, setEmpLoading] = useState(false);

  useEffect(() => {
    getDevices({ limit: 100 })
      .then((res) => setDevices(res.data))
      .catch(() => {});
  }, []);

  const fetchEmployeesForPicker = useCallback(
    async (page: number, search: string) => {
      setEmpLoading(true);
      try {
        const r = await searchEmployees({ search, page, limit: 20 });
        setEmpData(r.data || []);
        setEmpTotal(r.pagination?.total || 0);
      } catch {
        setEmpData([]);
        setEmpTotal(0);
      } finally {
        setEmpLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!empDialogOpen) return;
    const timer = setTimeout(
      () => {
        fetchEmployeesForPicker(empPage, empSearch);
      },
      empSearch ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [empDialogOpen, empPage, empSearch, fetchEmployeesForPicker]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployeeDeviceUsers({ page, limit: ITEMS_PER_PAGE });
      setMappings(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      toast.error("Failed to load device user mappings");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      employee_id: 0,
      device_id: "",
      device_user_id: "",
      active: true,
    });
    setSelectedEmployee(null);
    setShowDialog(true);
  };

  const openEdit = (m: EmployeeDeviceUser) => {
    setEditing(m);
    setForm({
      employee_id: m.employee_id,
      device_id: String(m.device_id),
      device_user_id: m.device_user_id,
      active: m.active,
    });
    setSelectedEmployee({
      id: m.employee_id,
      employee_code: m.employee_code,
      first_name: m.first_name,
      last_name: m.last_name,
      department: null,
      position: null,
    });
    setShowDialog(true);
  };

  const selectEmployee = (emp: any) => {
    setSelectedEmployee(emp);
    setForm((prev) => ({ ...prev, employee_id: emp.id }));
    setEmpDialogOpen(false);
  };

  const handleSave = async () => {
    if (!form.employee_id) {
      toast.error("Select an employee");
      return;
    }
    if (!form.device_id) {
      toast.error("Select a device");
      return;
    }
    if (!form.device_user_id.trim()) {
      toast.error("Device User ID is required");
      return;
    }
    try {
      const payload = {
        employee_id: form.employee_id,
        device_id: parseInt(form.device_id),
        device_user_id: form.device_user_id.trim(),
        active: form.active,
      };
      if (editing) {
        await updateEmployeeDeviceUser(editing.id, payload);
        toast.success("Mapping updated");
      } else {
        await createEmployeeDeviceUser(payload);
        toast.success("Mapping created");
      }
      setShowDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save mapping");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this device user mapping?")) return;
    try {
      await deleteEmployeeDeviceUser(id);
      toast.success("Mapping deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete mapping");
    }
  };

  const filteredMappings = search
    ? mappings.filter(
        (m) =>
          (m.employee_code || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (m.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (m.last_name || "").toLowerCase().includes(search.toLowerCase()),
      )
    : mappings;

  const deviceName = (id: number) =>
    devices.find((d) => d.id === id)?.name || `Device #${id}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by employee name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Mapping
          </Button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Employee Code</TableHead>
                <TableHead>Employee Name</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Device User ID</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMappings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 6 : 5}
                    className="text-center py-8 text-muted-foreground italic"
                  >
                    {search
                      ? "No matching mappings found."
                      : "No device user mappings configured."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMappings.map((m) => (
                  <TableRow
                    key={m.id}
                    className="border-b border-gray-400/50 dark:border-gray-400/50"
                  >
                    <TableCell className="font-mono text-xs">
                      {m.employee_code || "—"}
                    </TableCell>
                    <TableCell>
                      {[m.first_name, m.last_name].filter(Boolean).join(" ") ||
                        "—"}
                    </TableCell>
                    <TableCell>{deviceName(m.device_id)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.device_user_id}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={m.active ? "default" : "secondary"}
                        className={
                          m.active
                            ? getStatusBadgeClass("success")
                            : getStatusBadgeClass("neutral")
                        }
                      >
                        {m.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(m)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(m.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={ITEMS_PER_PAGE}
        showPageSize={false}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="!max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Mapping" : "Add Mapping"}
            </DialogTitle>
            <DialogDescription>
              Map a device user ID to an employee record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Employee *</Label>
              {selectedEmployee ? (
                <div className="flex items-center justify-between border rounded-md px-3 py-2 mt-1">
                  <div className="text-sm">
                    <span className="font-mono text-xs font-medium">
                      {selectedEmployee.employee_code}
                    </span>
                    {" — "}
                    {[selectedEmployee.first_name, selectedEmployee.last_name]
                      .filter(Boolean)
                      .join(" ")}
                    {selectedEmployee.department && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({selectedEmployee.department})
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployee(null);
                      setForm((prev) => ({ ...prev, employee_id: 0 }));
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmpDialogOpen(true)}
                  className="w-full justify-start text-muted-foreground mt-1"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Select Employee
                </Button>
              )}
            </div>
            <div>
              <Label>Device *</Label>
              <Select
                value={form.device_id}
                onValueChange={(v) => setForm({ ...form, device_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Device User ID *</Label>
              <Input
                value={form.device_user_id}
                onChange={(e) =>
                  setForm({ ...form, device_user_id: e.target.value })
                }
                placeholder="e.g. 1001, USER001, 12345"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The user identifier from the device (e.g. fingerprint ID, RFID
                tag, username).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
                size="sm"
              />
              <Label className="!mt-0">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee selector dialog */}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="!max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or department..."
                value={empSearch}
                onChange={(e) => {
                  setEmpSearch(e.target.value);
                  setEmpPage(1);
                }}
                className="w-full pl-7 pr-10"
              />
              {empSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEmpSearch("");
                    setEmpPage(1);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="rounded-md border max-h-64 overflow-y-auto">
              {empLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader />
                </div>
              ) : empData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No employees found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted sticky top-0">
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empData.map((emp: any) => (
                      <TableRow
                        key={emp.id}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => {
                          selectEmployee(emp);
                        }}
                      >
                        <TableCell className="font-mono text-xs">
                          {emp.employee_code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {emp.first_name} {emp.last_name}
                        </TableCell>
                        <TableCell>{emp.department || "-"}</TableCell>
                        <TableCell>{emp.position || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            {empTotal > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={empPage <= 1}
                    onClick={() => setEmpPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {empTotal > 0 ? empPage : 0} of{" "}
                    {Math.ceil(empTotal / 20) || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={empPage >= Math.ceil(empTotal / 20)}
                    onClick={() => setEmpPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {empData.length} per page
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── DEVICE LOG MAPPINGS TAB ─────────────────────────────────

function MappingsTab({ canManage }: { canManage: boolean }) {
  const [mappings, setMappings] = useState<DeviceLogMapping[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceFilter, setDeviceFilter] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<DeviceLogMapping | null>(null);
  const [form, setForm] = useState({
    device_id: "",
    field_source: "",
    field_target: "",
    transform_expression: "",
  });

  const TARGET_FIELDS = [
    "employee_code",
    "timestamp",
    "event_type",
    "device_id",
    "employee_id",
  ];
  const SOURCE_FIELDS = [
    "employee_code",
    "employeeCode",
    "employee_id",
    "employeeId",
    "user_id",
    "userId",
    "card_number",
    "cardNumber",
    "rfid_tag",
    "rfidTag",
    "fingerprint_id",
    "fingerprintId",
    "face_id",
    "faceId",
    "pin",
    "timestamp",
    "date_time",
    "datetime",
    "time",
    "log_time",
    "event_type",
    "eventType",
    "event",
    "status",
    "device_id",
    "deviceId",
    "name",
    "first_name",
    "last_name",
  ];

  useEffect(() => {
    getDevices({ limit: 100 })
      .then((res) => setDevices(res.data))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, d] = await Promise.all([
        getMappings(
          deviceFilter && deviceFilter !== "all"
            ? parseInt(deviceFilter)
            : undefined,
        ),
        getDevices({ limit: 100 }),
      ]);
      setMappings(m);
      setDevices(d.data);
    } catch {
      toast.error("Failed to load mappings");
    } finally {
      setLoading(false);
    }
  }, [deviceFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      device_id: "",
      field_source: "",
      field_target: "",
      transform_expression: "",
    });
    setShowDialog(true);
  };

  const openEdit = (m: DeviceLogMapping) => {
    setEditing(m);
    setForm({
      device_id: String(m.device_id),
      field_source: m.field_source,
      field_target: m.field_target,
      transform_expression: m.transform_expression || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.device_id || !form.field_source || !form.field_target) {
      toast.error("Device, source field, and target field are required");
      return;
    }
    try {
      const payload = {
        device_id: parseInt(form.device_id),
        field_source: form.field_source,
        field_target: form.field_target,
        transform_expression: form.transform_expression || null,
      };
      if (editing) {
        await updateMapping(editing.id, {
          ...payload,
          is_active: editing.is_active,
        });
        toast.success("Mapping updated");
      } else {
        await createMapping(payload);
        toast.success("Mapping created");
      }
      setShowDialog(false);
      fetchData();
    } catch {
      toast.error("Failed to save mapping");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this mapping?")) return;
    try {
      await deleteMapping(id);
      toast.success("Mapping deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete mapping");
    }
  };

  const toggleMapping = async (m: DeviceLogMapping) => {
    try {
      await updateMapping(m.id, {
        device_id: m.device_id,
        field_source: m.field_source,
        field_target: m.field_target,
        transform_expression: m.transform_expression,
        is_active: !m.is_active,
      });
      toast.success(`Mapping ${m.is_active ? "disabled" : "enabled"}`);
      fetchData();
    } catch {
      toast.error("Failed to toggle mapping");
    }
  };

  const deviceName = (id: number) =>
    devices.find((d) => d.id === id)?.name || `Device #${id}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select
            value={deviceFilter}
            onValueChange={(v) => {
              setDeviceFilter(v);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Devices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              {devices.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Mapping
          </Button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Device</TableHead>
                <TableHead>Source Field</TableHead>
                <TableHead>Target Field</TableHead>
                <TableHead>Transform</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="w-32">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 6 : 5}
                    className="text-center py-8 text-muted-foreground italic"
                  >
                    No mappings configured.
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((m) => (
                  <TableRow
                    key={m.id}
                    className="border-b border-gray-400/50 dark:border-gray-400/50"
                  >
                    <TableCell>{deviceName(m.device_id)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.field_source}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.field_target}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.transform_expression || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={m.is_active ? "default" : "secondary"}
                        className={
                          m.is_active
                            ? getStatusBadgeClass("success")
                            : getStatusBadgeClass("neutral")
                        }
                      >
                        {m.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={m.is_active}
                            onCheckedChange={() => toggleMapping(m)}
                            size="sm"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(m)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(m.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="!max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Mapping" : "Add Mapping"}
            </DialogTitle>
            <DialogDescription>
              Map a source field from the device payload to a system field.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Device *</Label>
              <Select
                value={form.device_id}
                onValueChange={(v) => setForm({ ...form, device_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source Field *</Label>
              <Select
                value={form.field_source}
                onValueChange={(v) => setForm({ ...form, field_source: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source field" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_FIELDS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Field name in the device payload
              </p>
            </div>
            <div>
              <Label>Target Field *</Label>
              <Select
                value={form.field_target}
                onValueChange={(v) => setForm({ ...form, field_target: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_FIELDS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Transform Expression (optional)</Label>
              <Input
                value={form.transform_expression}
                onChange={(e) =>
                  setForm({ ...form, transform_expression: e.target.value })
                }
                placeholder="e.g. trim, uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
