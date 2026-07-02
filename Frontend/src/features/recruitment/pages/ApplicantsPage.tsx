import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteApplicant,
} from "@/services/applicantService";
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
import { TablePagination } from "@/components/shared/TablePagination";
import { formatDateShort } from "@/utils/formatDate";
import { Users, Plus, Eye, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useApplicantsList } from "../hooks/useApplicantsList";
import { useActiveJobPositions } from "../hooks/useActiveJobPositions";

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
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canDelete = hasPermission("recruitment.applicants.delete");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Applicant | null>(null);

  const { data: applicantsResult, isLoading } = useApplicantsList(page, Number(pageSize), search, statusFilter, jobFilter);
  const { data: jobPositions = [] } = useActiveJobPositions();
  const applicants = applicantsResult?.data ?? [];
  const total = applicantsResult?.pagination?.total ?? 0;

  const activeFilterCount = [search, statusFilter, jobFilter].filter(Boolean).length;

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteApplicant(deleteTarget.id);
      toast.success("Applicant deleted");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
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
          <Users className="h-5 w-5 text-primary" />
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
          {isLoading ? (
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
          <TablePagination
            page={page}
            totalPages={Math.ceil(total / Number(pageSize))}
            totalItems={total}
            pageSize={Number(pageSize)}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(String(size)); setPage(1); }}
          />
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
