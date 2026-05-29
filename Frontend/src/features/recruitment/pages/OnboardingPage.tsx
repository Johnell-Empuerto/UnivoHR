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
import { formatDateShort } from "@/utils/formatDate";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { ClipboardList, Plus, ChevronLeft, ChevronRight, Loader2, Trash2, CheckCircle, Eye } from "lucide-react";
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
    PENDING: "bg-gray-100 text-gray-800", SUBMITTED: "bg-blue-100 text-blue-800",
    VERIFIED: "bg-green-100 text-green-800", REJECTED: "bg-red-100 text-red-800",
    IN_PROGRESS: "bg-amber-100 text-amber-800", COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };
  return <Badge className={map[status] || ""}>{status.replace(/_/g, " ")}</Badge>;
};

const OnboardingPage = () => {
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("..."); pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1); pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1); pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push("..."); pages.push(totalPages);
      }
    }
    return pages;
  };

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
          <ClipboardList className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">Employee Onboarding</h1>
          <p className="text-sm text-muted-foreground">Manage onboarding process for new employees</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border rounded px-3 py-1.5 text-sm bg-background w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border rounded px-3 py-1.5 text-sm bg-background"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
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
                          <Button variant="ghost" size="sm" title="View Requirements" onClick={() => openDetail(o)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {o.status === "PENDING" && (
                            <Button variant="ghost" size="sm" title="Start Onboarding" onClick={() => handleStatusChange(o.id, "IN_PROGRESS")}>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          {o.status === "IN_PROGRESS" && (
                            <Button variant="ghost" size="sm" title="Complete" onClick={() => handleStatusChange(o.id, "COMPLETED")}>
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
          {total > 0 && (
            <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <select value={pageSize} onChange={handleRowsPerPageChange}
                  className="border rounded px-2 py-1 text-sm bg-background">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {start} to {end} of {total} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)}
                  disabled={page === 1} className="h-8 w-8 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getPageNumbers().map((p, i) => (
                  <Button key={i} variant={page === p ? "default" : "outline"} size="sm"
                    onClick={() => typeof p === "number" && goToPage(p)} disabled={p === "..."}
                    className={`h-8 w-8 p-0 ${p === "..." ? "cursor-default" : ""}`}>{p}</Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages} className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteReq(r.id)}>
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
              <p className="text-xs text-muted-foreground mb-1">Requirement Name <span className="text-red-500">*</span></p>
              <input value={reqForm.requirement_name} onChange={(e) => setReqForm({ ...reqForm, requirement_name: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" placeholder="e.g., NBI Clearance" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <textarea value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" />
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
