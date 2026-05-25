import { useState, useEffect } from "react";
import {
  getBranches,
  createBranch,
  updateBranch,
  setBranchActive,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  Plus,
  Loader2,
  Pencil,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";

interface Branch {
  id: number;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  is_active: boolean;
}

const emptyForm = {
  code: "",
  name: "",
  address: "",
  city: "",
  province: "",
  phone: "",
};

const BranchesPage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

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
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      const updated = await setBranchActive(branch.id, !branch.is_active);
      setBranches((prev) =>
        prev.map((b) => (b.id === branch.id ? updated : b)),
      );
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
          <Building2 className="h-5 w-5 text-primary dark:text-black" />
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
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">
                Loading branches...
              </span>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No branches found. Create your first branch.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
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
                        {[branch.address, branch.city, branch.province]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={branch.is_active ? "default" : "secondary"}
                          className={
                            branch.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          }
                        >
                          {branch.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 rounded hover:bg-muted transition"
                            title="Edit"
                            onClick={() => handleOpenEdit(branch)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-muted transition"
                            title={branch.is_active ? "Deactivate" : "Activate"}
                            onClick={() => handleToggleActive(branch)}
                          >
                            {branch.is_active ? (
                              <PowerOff className="h-4 w-4 text-red-500 hover:text-red-700" />
                            ) : (
                              <Power className="h-4 w-4 text-green-500 hover:text-green-700" />
                            )}
                          </button>
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
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Branch Code <span className="text-red-500">*</span>
              </p>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1 bg-background"
                placeholder="e.g., BRN-001"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Branch Name <span className="text-red-500">*</span>
              </p>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1 bg-background"
                placeholder="e.g., Makati Branch"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1 bg-background"
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">City</p>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-background"
                  placeholder="City"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Province</p>
                <input
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-background"
                  placeholder="Province"
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1 bg-background"
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
    </div>
  );
};

export default BranchesPage;
