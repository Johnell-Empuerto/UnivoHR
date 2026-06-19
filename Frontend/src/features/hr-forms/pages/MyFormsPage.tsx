import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyHrAssignments } from "@/services/hrFormService";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { formatDateShort } from "@/utils/formatDate";
import { toast } from "sonner";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Pending: getStatusBadgeClass("warning"),
    Submitted: getStatusBadgeClass("info"),
    Reviewed: getStatusBadgeClass("success"),
  };
  return <Badge className={map[s] || ""}>{s}</Badge>;
};

const MyFormsPage = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const r = await getMyHrAssignments(page, pageSize);
        setAssignments(r.data || []);
        setTotal(r.pagination?.total || 0);
      } catch {
        toast.error("Failed to load forms");
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, pageSize]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-primary dark:text-black" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">My Forms</h1><p className="text-sm text-muted-foreground">View and fill assigned forms</p></div>
      </div>
      <Card className="shadow-sm">
        <CardContent>
          {loading ? (
            <Loader message="Loading forms..." />
          ) : assignments.length === 0 ? (
            <EmptyState message="No forms assigned" description="No forms have been assigned to you yet." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Form</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.form_title}</TableCell>
                      <TableCell className="text-sm">{formatDateShort(a.created_at)}</TableCell>
                      <TableCell className="text-sm">{a.due_date ? formatDateShort(a.due_date) : "-"}</TableCell>
                      <TableCell className="text-sm">{a.submitted_at ? formatDateShort(a.submitted_at) : "-"}</TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell>
                        {a.status === "Pending" ? (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/my-forms/${a.id}`)} className="flex items-center gap-1">
                            <ClipboardList className="h-4 w-4" /> Fill Form
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/my-forms/${a.id}`)} className="flex items-center gap-1">
                            <Eye className="h-4 w-4" /> View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {total > 0 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {start} to {end} of {total} entries
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)}
                  disabled={page === 1} className="h-8 w-8 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button key={p} variant={page === p ? "default" : "outline"} size="sm"
                    onClick={() => goToPage(p)} className="h-8 w-8 p-0">{p}</Button>
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

export default MyFormsPage;
