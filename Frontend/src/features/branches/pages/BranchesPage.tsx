import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getBranches,
  createBranch,
  updateBranch,
  setBranchActive,
  deleteBranch,
} from "@/services/branchService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import {
  Building2,
  Plus,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  Globe,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMEZONES = [
  "Asia/Manila",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Hong_Kong",
  "Asia/Seoul",
  "Asia/Dubai",
  "UTC",
];

interface Branch {
  id: number;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  timezone: string;
  is_active: boolean;
}

const emptyForm = {
  code: "",
  name: "",
  address: "",
  city: "",
  province: "",
  phone: "",
  timezone: "Asia/Manila",
};

const BranchesPage = () => {
  const queryClient = useQueryClient();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await getBranches();
      setBranches(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditId(branch.id);
    setForm({
      code: branch.code,
      name: branch.name,
      address: branch.address || "",
      city: branch.city || "",
      province: branch.province || "",
      phone: branch.phone || "",
      timezone: branch.timezone || "Asia/Manila",
    });
    setDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error("Branch code is required");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Branch name is required");
      return;
    }

    try {
      setSaving(true);
      if (editId) {
        await updateBranch(editId, form);
        toast.success("Branch updated");
      } else {
        await createBranch(form);
        toast.success("Branch created");
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (branch: Branch) => {
    setDeleteTarget(branch);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    try {
      await deleteBranch(target.id);
      toast.success("Branch deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      fetchBranches();
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || "Failed to delete branch";
      toast.error(message);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      const updated = await setBranchActive(branch.id, !branch.is_active);
      setBranches((prev) =>
        prev.map((b) => (b.id === branch.id ? updated : b)),
      );
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(
        updated.is_active ? "Branch activated" : "Branch deactivated",
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update branch status");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            Branches
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage company branches and locations
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Branches</CardTitle>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Branch
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader message="Loading branches..." />
          ) : branches.length === 0 ? (
            <EmptyState message="No branches found" description="Create your first branch." action={{ label: "Add Branch", onClick: handleOpenCreate }} />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Timezone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">
                        {branch.code}
                      </TableCell>
                      <TableCell>{branch.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs font-mono bg-muted px-2 py-0.5 rounded">
                          <Globe className="h-3 w-3" />
                          {branch.timezone || "Asia/Manila"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {[branch.address, branch.city, branch.province]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={branch.is_active ? "default" : "secondary"}
                          className={branch.is_active ? getStatusBadgeClass("success") : getStatusBadgeClass("neutral")}
                        >
                          {branch.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Edit"
                            onClick={() => handleOpenEdit(branch)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={branch.is_active ? "Deactivate" : "Activate"}
                            onClick={() => handleToggleActive(branch)}
                          >
                            {branch.is_active ? (
                              <PowerOff className="h-4 w-4 text-red-500" />
                            ) : (
                              <Power className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete"
                            onClick={() => handleDeleteClick(branch)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Branch" : "Add Branch"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Branch Code <span className="text-red-500">*</span>
              </Label>
              <Input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g., BRN-001"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Branch Name <span className="text-red-500">*</span>
              </Label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Makati Branch"
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={form.timezone}
                onValueChange={(v) => setForm({ ...form, timezone: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Input
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  placeholder="Province"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Contact number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? "Save Changes" : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BranchesPage;
