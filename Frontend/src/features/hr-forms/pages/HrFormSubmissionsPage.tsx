import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHrSubmissions } from "@/services/hrFormService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, FileText } from "lucide-react";

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
  const [search, setSearch] = useState("");

  useEffect(() => { fetchSubmissions(); }, [page, search]);

  const fetchSubmissions = async () => {
    try { setLoading(true); const r = await getHrSubmissions(page, 10, search); setSubmissions(r.data); setTotal(r.total); }
    catch { setSubmissions([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
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
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin mr-2" /><span>Loading...</span></div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No submissions yet.</div>
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
                        <button className="p-1 rounded hover:bg-muted" title="View" onClick={() => navigate(`/hr-forms/submissions/${s.id}`)}>
                          <Eye className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>{total} total</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HrFormSubmissionsPage;
