import { useState, useEffect } from "react";
import {
  getEmployeeOnboardings,
  updateEmployeeOnboarding,
} from "@/services/employeeOnboardingService";
import { getEmployeeRequirements, createEmployeeRequirement, updateEmployeeRequirement, deleteEmployeeRequirement } from "@/services/employeeRequirementService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatDateShort } from "@/utils/formatDate";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { ClipboardList, Plus, Loader2, Trash2, CheckCircle, Eye, Search, X } from "lucide-react";
import { toast } from "sonner";

interface Onboarding {
  id: number; employee_id: number; applicant_id: number | null;
  onboarding_date: string | null; status: string; notes: string | null;
  first_name: string; last_name: string; employee_code: string;
  department: string | null; position: string | null;
}

interface Requirement {
  id: number; onboarding_id: number; requirement_name: string;
  description: string | null; status: string; submitted_at: string | null;
  verified_at: string | null; file_url: string | null;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    PENDING: getStatusBadgeClass("neutral"), SUBMITTED: getStatusBadgeClass("info"),
    VERIFIED: getStatusBadgeClass("success"), REJECTED: getStatusBadgeClass("danger"),
    IN_PROGRESS: getStatusBadgeClass("warning"), COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    CANCELLED: getStatusBadgeClass("neutral"),
  };
  return <Badge className={map[status] || getStatusBadgeClass("neutral")}>{status.replace(/_/g, " ")}</Badge>;
};

const OnboardingPage = () => {
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const activeFilterCount = [search, statusFilter].filter(Boolean).length;

  const [selectedOnboarding, setSelectedOnboarding] = useState<Onboarding | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reqDialog, setReqDialog] = useState(false);
  const [reqForm, setReqForm] = useState({ requirement_name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOnboardings();
  }, [page, pageSize, search, statusFilter]);

  const fetchOnboardings = async () => {
    try {
      setLoading(true);
      const result = await getEmployeeOnboardings(page, pageSize, search, statusFilter);
      setOnboardings(result.data);
      setTotal(result.pagination.total);
    } catch (err: any) {
      toast.error(err.message || "Failed to load onboardings");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (onboarding: Onboarding) => {
    setSelectedOnboarding(onboarding);
    try {
      const reqs = await getEmployeeRequirements(onboarding.id);
      setRequirements(reqs);
    } catch {
      setRequirements([]);
    }
    setDetailOpen(true);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateEmployeeOnboarding(id, { status });
      toast.success(`Onboarding ${status.toLowerCase()}`);
      fetchOnboardings();
      if (selectedOnboarding?.id === id) {
        setSelectedOnboarding({ ...selectedOnboarding, status });
      }
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleAddRequirement = async () => {
    if (!reqForm.requirement_name.trim()) { toast.error("Requirement name is required"); return; }
    if (!selectedOnboarding) return;
    try {
      setSaving(true);
      await createEmployeeRequirement(selectedOnboarding.id, reqForm);
      toast.success("Requirement added");
      setReqDialog(false);
      setReqForm({ requirement_name: "", description: "" });
      const reqs = await getEmployeeRequirements(selectedOnboarding.id);
      setRequirements(reqs);
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReqStatus = async (reqId: number, status: string) => {
    try {
      const now = new Date().toISOString();
      await updateEmployeeRequirement(reqId, {
        status,
        submitted_at: status === "SUBMITTED" ? now : undefined,
        verified_at: status === "VERIFIED" ? now : undefined,
      });
      toast.success(`Requirement ${status.toLowerCase()}`);
      if (selectedOnboarding) {
        const reqs = await getEmployeeRequirements(selectedOnboarding.id);
        setRequirements(reqs);
      }
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleDeleteReq = async (reqId: number) => {
    if (!confirm("Delete this requirement?")) return;
    try {
      await deleteEmployeeRequirement(reqId);
      toast.success("Requirement deleted");
      if (selectedOnboarding) {
        const reqs = await getEmployeeRequirements(selectedOnboarding.id);
        setRequirements(reqs);
      }
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">Employee Onboarding</h1>
          <p className="text-sm text-muted-foreground">Manage onboarding process for new employees</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter || undefined} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader message="Loading onboarding records..." />
          ) : onboardings.length === 0 ? (
            <EmptyState message="No onboarding records found." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Onboarding Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onboardings.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.first_name} {o.last_name}</TableCell>
                      <TableCell>{o.employee_code}</TableCell>
                      <TableCell>{o.department || "-"}</TableCell>
                      <TableCell>{o.onboarding_date ? formatDateShort(o.onboarding_date) : "-"}</TableCell>
                      <TableCell>{statusBadge(o.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon-sm" title="View Requirements" onClick={() => openDetail(o)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {o.status === "PENDING" && (
                            <Button variant="ghost" size="icon-sm" title="Start Onboarding" onClick={() => handleStatusChange(o.id, "IN_PROGRESS")}>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          {o.status === "IN_PROGRESS" && (
                            <Button variant="ghost" size="icon-sm" title="Complete" onClick={() => handleStatusChange(o.id, "COMPLETED")}>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <TablePagination
            page={page}
            totalPages={Math.ceil(total / pageSize)}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Onboarding: {selectedOnboarding?.first_name} {selectedOnboarding?.last_name}
              <span className="ml-2">{selectedOnboarding && statusBadge(selectedOnboarding.status)}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedOnboarding && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><span className="text-muted-foreground">Employee Code:</span> {selectedOnboarding.employee_code}</p>
                <p><span className="text-muted-foreground">Position:</span> {selectedOnboarding.position || "-"}</p>
                <p><span className="text-muted-foreground">Department:</span> {selectedOnboarding.department || "-"}</p>
                <p><span className="text-muted-foreground">Date:</span> {selectedOnboarding.onboarding_date ? formatDateShort(selectedOnboarding.onboarding_date) : "-"}</p>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-medium">Requirements Checklist</h3>
                <Button size="sm" onClick={() => setReqDialog(true)} className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Add Requirement
                </Button>
              </div>

              {requirements.length === 0 ? (
                <EmptyState message="No requirements added yet." />
              ) : (
                <div className="space-y-2">
                  {requirements.map((r) => (
                    <div key={r.id} className="border rounded-lg p-3 flex items-start justify-between">
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{r.requirement_name}</p>
                        {r.description && <p className="text-muted-foreground">{r.description}</p>}
                        <div className="flex items-center gap-2">{statusBadge(r.status)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status === "PENDING" && (
                          <Button size="sm" variant="outline" onClick={() => handleReqStatus(r.id, "SUBMITTED")}>Submit</Button>
                        )}
                        {r.status === "SUBMITTED" && (
                          <>
                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleReqStatus(r.id, "VERIFIED")}>Verify</Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleReqStatus(r.id, "REJECTED")}>Reject</Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteReq(r.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reqDialog} onOpenChange={setReqDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Requirement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Requirement Name <span className="text-red-500">*</span></Label>
              <Input value={reqForm.requirement_name} onChange={(e) => setReqForm({ ...reqForm, requirement_name: e.target.value })} placeholder="e.g., NBI Clearance" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} className="min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReqDialog(false)}>Cancel</Button>
            <Button onClick={handleAddRequirement} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnboardingPage;
