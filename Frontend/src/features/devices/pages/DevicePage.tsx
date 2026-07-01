import { useState, useEffect } from "react";
import {
  createDevice,
  updateDevice,
  deleteDevice,
} from "@/services/deviceIntegrationService";
import { useDevices } from "@/hooks/useDevices";
import { useActiveBranches } from "@/hooks/useBranches";
import type { Device } from "@/services/deviceIntegrationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";
import { Server, Plus, Search, RefreshCw } from "lucide-react";
import DeviceTable from "../components/DeviceTable";

const DevicePage = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("devices.manage");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { data: branches = [] } = useActiveBranches();
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

  const { data: deviceResponse, isFetching, refetch } = useDevices(page, rowsPerPage, debouncedSearch || undefined);
  const devices = deviceResponse?.data ?? [];
  const totalPages = deviceResponse?.pagination?.totalPages ?? 1;
  const totalRecords = deviceResponse?.pagination?.total ?? 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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
      refetch();
    } catch {
      toast.error("Failed to save device");
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm === null) return;
    try {
      await deleteDevice(deleteConfirm);
      toast.success("Device deleted");
      setDeleteConfirm(null);
      refetch();
    } catch {
      toast.error("Failed to delete device");
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Server className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">Devices</h1>
          <p className="text-sm text-muted-foreground">
            Manage biometric devices, card readers, and API endpoints
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Devices</CardTitle>
          {canManage && (
            <Button onClick={openCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <DeviceTable
            data={devices}
            canManage={canManage}
            currentPage={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            rowsPerPage={rowsPerPage}
            onEdit={openEdit}
            onDelete={handleDelete}
            loading={isFetching}
          />
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl!">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Device" : "Add Device"}</DialogTitle>
            <DialogDescription>
              Configure the device connection details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Device Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Main Entrance Biometric"
              />
            </div>
            <div>
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
            <div>
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
            <div>
              <Label>Serial Number</Label>
              <Input
                value={form.serial_number}
                onChange={(e) =>
                  setForm({ ...form, serial_number: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Model</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>IP Address</Label>
              <Input
                value={form.ip_address}
                onChange={(e) =>
                  setForm({ ...form, ip_address: e.target.value })
                }
                placeholder="e.g. 192.168.1.100"
              />
            </div>
            <div>
              <Label>Port</Label>
              <Input
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
                placeholder="e.g. 4370"
              />
            </div>
            <div className="col-span-2">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Main Entrance"
              />
            </div>
            <div>
              <Label>Branch</Label>
              <Select
                value={form.branch_id}
                onValueChange={(v) => setForm({ ...form, branch_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No branch assigned" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b: { id: number; name: string; timezone?: string }) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                      {b.timezone ? ` (${b.timezone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>API Key</Label>
              <Input
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                placeholder="For device authentication"
              />
            </div>
            <div className="col-span-2">
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

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this device and all associated data? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DevicePage;
