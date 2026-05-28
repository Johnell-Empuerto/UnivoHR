import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getApplicantById,
  updateApplicant,
  convertApplicantToEmployee,
} from "@/services/applicantService";
import {
  getApplicantRequirements,
  createApplicantRequirement,
  updateApplicantRequirement,
  deleteApplicantRequirement,
} from "@/services/applicantRequirementService";
import { getActiveBranches } from "@/services/branchService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Loader2, UserPlus, Plus, Pencil, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";

interface Applicant {
  id: number; job_position_id: number | null; first_name: string; middle_name: string | null;
  last_name: string; suffix: string | null; email: string | null; phone: string | null;
  address: string | null; resume_url: string | null; status: string; rating: string | null;
  source: string | null; notes: string | null; applied_date: string;
  job_title: string | null; job_department: string | null; employee_id: number | null;
}

interface Requirement {
  id: number; applicant_id: number; requirement_name: string;
  status: string; remarks: string | null; verified_date: string | null;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Initial: "bg-blue-100 text-blue-800",
    Pending: "bg-purple-100 text-purple-800",
    "Final Interview": "bg-amber-100 text-amber-800",
    "Exam Interview": "bg-indigo-100 text-indigo-800",
    Completed: "bg-green-100 text-green-800",
    Fail: "bg-red-100 text-red-800",
  };
  return <Badge className={map[status] || ""}>{status}</Badge>;
};

const reqStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    Pending: "bg-gray-100 text-gray-800",
    Completed: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
  };
  return <Badge className={map[status] || ""}>{status}</Badge>;
};

const ApplicantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "HR_ADMIN";

  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [branches, setBranches] = useState<{ id: number; code: string; name: string }[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ status: "", rating: "", notes: "" });

  const [convertDialog, setConvertDialog] = useState(false);
  const [convertForm, setConvertForm] = useState({ branch_id: "", hired_date: new Date().toISOString().split("T")[0] });
  const [converting, setConverting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [reqDialog, setReqDialog] = useState(false);
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);
  const [reqForm, setReqForm] = useState({ requirement_name: "", status: "Pending", remarks: "" });

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [app, reqs, brs] = await Promise.all([
        getApplicantById(Number(id)),
        getApplicantRequirements(Number(id)).catch(() => []),
        getActiveBranches().catch(() => []),
      ]);
      setApplicant(app);
      setRequirements(reqs);
      setBranches(brs);
      setEditForm({ status: app.status, rating: app.rating || "", notes: app.notes || "" });
    } catch (err: any) {
      toast.error("Failed to load applicant details");
      navigate("/recruitment/applicants");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      const reqs = await getApplicantRequirements(Number(id));
      setRequirements(reqs);
    } catch {
      setRequirements([]);
    }
  };

  const handleSaveDetails = async () => {
    try {
      setSaving(true);
      await updateApplicant(Number(id), editForm);
      toast.success("Applicant updated");
      setEditDialog(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddReq = () => {
    setEditingReq(null);
    setReqForm({ requirement_name: "", status: "Pending", remarks: "" });
    setReqDialog(true);
  };

  const handleOpenEditReq = (req: Requirement) => {
    setEditingReq(req);
    setReqForm({
      requirement_name: req.requirement_name,
      status: req.status,
      remarks: req.remarks || "",
    });
    setReqDialog(true);
  };

  const handleSaveReq = async () => {
    if (!reqForm.requirement_name.trim()) {
      toast.error("Requirement name is required");
      return;
    }
    try {
      setSaving(true);
      if (editingReq) {
        await updateApplicantRequirement(Number(id), editingReq.id, reqForm);
        toast.success("Requirement updated");
      } else {
        await createApplicantRequirement(Number(id), reqForm);
        toast.success("Requirement added");
      }
      setReqDialog(false);
      fetchRequirements();
    } catch (err: any) {
      toast.error(err.message || "Failed to save requirement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReq = async (reqId: number) => {
    if (!confirm("Delete this requirement?")) return;
    try {
      await deleteApplicantRequirement(Number(id), reqId);
      toast.success("Requirement deleted");
      fetchRequirements();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleReqStatus = async (req: Requirement, newStatus: string) => {
    try {
      await updateApplicantRequirement(Number(id), req.id, {
        requirement_name: req.requirement_name,
        status: newStatus,
        remarks: req.remarks || "",
      });
      toast.success(`Requirement marked as ${newStatus}`);
      fetchRequirements();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleConvertClick = async () => {
    const uncompleted = requirements.filter((r) => r.status !== "Completed");
    if (requirements.length > 0 && uncompleted.length > 0) {
      const proceed = confirm(
        "Some requirements are not yet completed. Continue converting this applicant?",
      );
      if (!proceed) return;
    }
    setConvertDialog(true);
  };

  const handleConvert = async () => {
    try {
      setConverting(true);
      const result = await convertApplicantToEmployee(Number(id), convertForm);
      toast.success(result.message || "Applicant converted to employee successfully!");
      setConvertDialog(false);
      fetchAll();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to convert applicant.";
      if (message.includes("already been converted")) {
        toast.error("This applicant has already been converted to an employee.");
      } else if (message.includes("Completed")) {
        toast.error("Applicant must be marked Completed before converting.");
      } else if (message.includes("requirements")) {
        toast.error(message);
      } else {
        toast.error("Unable to convert applicant. Please try again.");
      }
      fetchAll();
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!applicant) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/recruitment/applicants")} className="p-1 rounded hover:bg-muted transition">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            {applicant.first_name} {applicant.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">{applicant.job_title || "No position assigned"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {statusBadge(applicant.status)}
          {applicant.employee_id && (
            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
              <UserPlus className="h-3 w-3" /> Converted to Employee
            </Badge>
          )}
          {isAdmin && applicant.status === "Completed" && !applicant.employee_id && (
            <Button size="sm" onClick={handleConvertClick} className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" /> Convert to Employee
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setEditDialog(true)}>Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {applicant.first_name} {applicant.middle_name || ""} {applicant.last_name}{applicant.suffix ? ", " + applicant.suffix : ""}</p>
            <p><span className="text-muted-foreground">Email:</span> {applicant.email || "-"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {applicant.phone || "-"}</p>
            <p><span className="text-muted-foreground">Address:</span> {applicant.address || "-"}</p>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Application Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Position:</span> {applicant.job_title || "-"}</p>
            <p><span className="text-muted-foreground">Department:</span> {applicant.job_department || "-"}</p>
            <p><span className="text-muted-foreground">Applied:</span> {applicant.applied_date ? new Date(applicant.applied_date).toLocaleDateString() : "-"}</p>
            <p><span className="text-muted-foreground">Source:</span> {applicant.source || "-"}</p>
            <p><span className="text-muted-foreground">Rating:</span> {applicant.rating || "-"}</p>
            {applicant.notes && <p><span className="text-muted-foreground">Notes:</span> {applicant.notes}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Requirements</CardTitle>
          <Button size="sm" onClick={handleOpenAddReq} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Requirement
          </Button>
        </CardHeader>
        <CardContent>
          {requirements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No requirements added yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Requirement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.requirement_name}</TableCell>
                      <TableCell>{reqStatusBadge(r.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.remarks || "-"}</TableCell>
                      <TableCell className="text-sm">{r.verified_date ? new Date(r.verified_date).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          <button className="p-1 rounded hover:bg-muted" title="Edit" onClick={() => handleOpenEditReq(r)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button className="p-1 rounded hover:bg-muted" title="Delete" onClick={() => handleDeleteReq(r.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                          <button className="px-2 py-0.5 text-xs rounded border hover:bg-muted" onClick={() => handleReqStatus(r, "Pending")}>Pending</button>
                          <button className="px-2 py-0.5 text-xs rounded border text-green-600 hover:bg-green-50" onClick={() => handleReqStatus(r, "Completed")}>Complete</button>
                          <button className="px-2 py-0.5 text-xs rounded border text-red-600 hover:bg-red-50" onClick={() => handleReqStatus(r, "Rejected")}>Reject</button>
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

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Applicant</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <select name="status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                <option value="Initial">Initial</option>
                <option value="Pending">Pending</option>
                <option value="Final Interview">Final Interview</option>
                <option value="Exam Interview">Exam Interview</option>
                <option value="Completed">Completed</option>
                <option value="Fail">Fail</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Rating</p>
              <input name="rating" value={editForm.rating} onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" placeholder="1-10" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <textarea name="notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full border rounded px-2 py-1 bg-background min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveDetails} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reqDialog} onOpenChange={setReqDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingReq ? "Edit Requirement" : "Add Requirement"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Requirement Name <span className="text-red-500">*</span></p>
              <input
                value={reqForm.requirement_name}
                onChange={(e) => setReqForm({ ...reqForm, requirement_name: e.target.value })}
                className="w-full border rounded px-2 py-1 bg-background"
                placeholder="e.g., Diploma, NBI Clearance, Medical"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <select
                value={reqForm.status}
                onChange={(e) => setReqForm({ ...reqForm, status: e.target.value })}
                className="w-full border rounded px-2 py-1 bg-background"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Remarks</p>
              <textarea
                value={reqForm.remarks}
                onChange={(e) => setReqForm({ ...reqForm, remarks: e.target.value })}
                className="w-full border rounded px-2 py-1 bg-background min-h-[60px]"
                placeholder="Optional remarks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReqDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveReq} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingReq ? "Save Changes" : "Add Requirement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={convertDialog} onOpenChange={setConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Convert to Employee</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            This will create an employee record for {applicant.first_name} {applicant.last_name} as Probationary.
          </p>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Branch</p>
              <select value={convertForm.branch_id} onChange={(e) => setConvertForm({ ...convertForm, branch_id: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hired Date</p>
              <input type="date" value={convertForm.hired_date} onChange={(e) => setConvertForm({ ...convertForm, hired_date: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialog(false)}>Cancel</Button>
            <Button onClick={handleConvert} disabled={converting}>
              {converting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Convert & Hire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicantDetailPage;