import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getApplicants,
  deleteApplicant,
} from "@/services/applicantService";
import { getActiveJobPositions } from "@/services/jobPositionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/Input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { formatDateShort } from "@/utils/formatDate";
import { Users, Plus, ChevronLeft, ChevronRight, Eye, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface Applicant {
  id: number;
  job_position_id: number | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  rating: string | null;
  applied_date: string;
  job_title: string | null;
  job_department: string | null;
  workflow_instance_id: number | null;
  workflow_name: string | null;
}

interface JobPosition {
  id: number;
  title: string;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Initial: getStatusBadgeClass("info"),
    Pending: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    "Final Interview": getStatusBadgeClass("warning"),
    "Exam Interview": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    Completed: getStatusBadgeClass("success"),
    Fail: getStatusBadgeClass("danger"),
  };
  return <Badge className={map[status] || getStatusBadgeClass("neutral")}>{status}</Badge>;
};

const ApplicantsPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canDelete = hasPermission("recruitment.applicants.delete");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Applicant | null>(null);

  const activeFilterCount = [search, statusFilter, jobFilter].filter(Boolean).length;

  const pageSizeNum = Number(pageSize);
  const totalPages = Math.ceil(total / pageSizeNum);
  const start = (page - 1) * pageSizeNum + 1;
  const end = Math.min(page * pageSizeNum, total);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
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

  useEffect(() => {
    fetchApplicants();
    fetchJobPositions();
  }, [page, pageSize, search, statusFilter, jobFilter]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const normalizedStatus = statusFilter === "all" ? "" : statusFilter;
      const normalizedJob = jobFilter === "all" ? "" : jobFilter;
      const result = await getApplicants(page, pageSizeNum, search, normalizedStatus, normalizedJob);
      setApplicants(result.data);
      setTotal(result.pagination.total);
    } catch (err: any) {
      toast.error(err.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobPositions = async () => {
    try {
      const data = await getActiveJobPositions();
      setJobPositions(data);
    } catch { /* ignore */ }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteApplicant(deleteTarget.id);
      toast.success("Applicant deleted");
      setDeleteTarget(null);
      fetchApplicants();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Delete failed");
      setDeleteTarget(null);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setJobFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">Applicants</h1>
          <p className="text-sm text-muted-foreground">Manage job applicants and track their progress</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              placeholder="Search applicants..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-56"
            />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Initial">Initial</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Final Interview">Final Interview</SelectItem>
                <SelectItem value="Exam Interview">Exam Interview</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Fail">Fail</SelectItem>
              </SelectContent>
            </Select>
            <Select value={jobFilter} onValueChange={(v) => { setJobFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {jobPositions.map((jp) => (
                  <SelectItem key={jp.id} value={String(jp.id)}>{jp.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
          <Button onClick={() => navigate("/recruitment/applicants/new")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Applicant
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader message="Loading applicants..." />
          ) : applicants.length === 0 ? (
            <EmptyState message="No applicants found." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicants.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.first_name} {a.middle_name ? a.middle_name + " " : ""}{a.last_name}{a.suffix ? ", " + a.suffix : ""}
                      </TableCell>
                      <TableCell>{a.job_title || "-"}</TableCell>
                      <TableCell>{a.applied_date ? formatDateShort(a.applied_date) : "-"}</TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell>
                        <Badge className={a.workflow_instance_id ? getStatusBadgeClass("info") : getStatusBadgeClass("neutral")}>
                          {a.workflow_instance_id ? "Dynamic" : "Legacy"}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.rating || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" title="View" onClick={() => navigate(`/recruitment/applicants/${a.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button variant="ghost" size="sm" title="Delete" onClick={() => setDeleteTarget(a)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
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
                <Select value={pageSize} onValueChange={(v) => { setPageSize(v); setPage(1); }}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Applicant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.first_name} {deleteTarget?.last_name}</strong>?
              Applicants with workflow history, interviews, approvals, or conversion records cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApplicantsPage;
