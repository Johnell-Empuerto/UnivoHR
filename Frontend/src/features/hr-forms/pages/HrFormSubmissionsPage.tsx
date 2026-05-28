import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHrSubmissions } from "@/services/hrFormService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronLeft, ChevronRight, Loader2, FileText } from "lucide-react";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";

const statusBadge = (s: string) => {
  const map: Record<string, string> = { Submitted: "bg-blue-100 text-blue-800", Reviewed: "bg-green-100 text-green-800" };
  return <Badge className={map[s] || ""}>{s}</Badge>;
};

const HrFormSubmissionsPage = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

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

  useEffect(() => { fetchSubmissions(); }, [page, pageSize, search]);

  const fetchSubmissions = async () => {
      try { setLoading(true); const r = await getHrSubmissions(page, pageSize, search); setSubmissions(r.data); setTotal(r.pagination.total); }
    catch { setSubmissions([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary dark:text-black" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">Form Submissions</h1><p className="text-sm text-muted-foreground">Review employee form submissions</p></div>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <input placeholder="Search employee or form..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border rounded px-3 py-1.5 text-sm bg-background w-64" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader message="Loading submissions..." />
          ) : submissions.length === 0 ? (
            <EmptyState message="No submissions yet" description="Submissions will appear here once employees fill out forms." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.employee_name}<p className="text-xs text-muted-foreground">{s.employee_code}</p></TableCell>
                      <TableCell>{s.form_title}</TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                      <TableCell>{new Date(s.submitted_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon-sm" title="View" onClick={() => navigate(`/hr-forms/submissions/${s.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
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

export default HrFormSubmissionsPage;
