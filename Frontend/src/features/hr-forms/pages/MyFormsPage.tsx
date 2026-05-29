import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyHrAssignments } from "@/services/hrFormService";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Loader2, Eye } from "lucide-react";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { formatDateShort } from "@/utils/formatDate";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Submitted: "bg-blue-100 text-blue-800",
    Reviewed: "bg-green-100 text-green-800",
  };
  return <Badge className={map[s] || ""}>{s}</Badge>;
};

const MyFormsPage = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { setLoading(true); const r = await getMyHrAssignments(); setAssignments(Array.isArray(r) ? r : []); }
      catch { setAssignments([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

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
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.form_title}</TableCell>
                      <TableCell>{a.due_date ? formatDateShort(a.due_date) : "-"}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default MyFormsPage;
