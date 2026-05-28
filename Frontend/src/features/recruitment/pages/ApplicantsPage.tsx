import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getApplicants,
  deleteApplicant,
} from "@/services/applicantService";
import { getActiveJobPositions } from "@/services/jobPositionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { Users, Plus, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
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
}

interface JobPosition {
  id: number;
  title: string;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Initial: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Pending: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    "Final Interview": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    "Exam Interview": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Fail: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return <Badge className={map[status] || ""}>{status}</Badge>;
};

const ApplicantsPage = () => {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);

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

  useEffect(() => {
    fetchApplicants();
    fetchJobPositions();
  }, [page, pageSize, search, statusFilter, jobFilter]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const result = await getApplicants(page, pageSize, search, statusFilter, jobFilter);
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

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this applicant? This will also remove all associated data.")) return;
    try {
      await deleteApplicant(id);
      toast.success("Applicant deleted");
      fetchApplicants();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
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
            <input
              placeholder="Search applicants..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border rounded px-3 py-1.5 text-sm bg-background w-56"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border rounded px-3 py-1.5 text-sm bg-background"
            >
              <option value="">All Status</option>
              <option value="Initial">Initial</option>
              <option value="Pending">Pending</option>
              <option value="Final Interview">Final Interview</option>
              <option value="Exam Interview">Exam Interview</option>
              <option value="Completed">Completed</option>
              <option value="Fail">Fail</option>
            </select>
            <select
              value={jobFilter}
              onChange={(e) => { setJobFilter(e.target.value); setPage(1); }}
              className="border rounded px-3 py-1.5 text-sm bg-background"
            >
              <option value="">All Positions</option>
              {jobPositions.map((jp) => (
                <option key={jp.id} value={jp.id}>{jp.title}</option>
              ))}
            </select>
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
                      <TableCell>{a.applied_date ? new Date(a.applied_date).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell>{a.rating || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" title="View" onClick={() => navigate(`/recruitment/applicants/${a.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Delete" onClick={() => handleDelete(a.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
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
    </div>
  );
};

export default ApplicantsPage;
