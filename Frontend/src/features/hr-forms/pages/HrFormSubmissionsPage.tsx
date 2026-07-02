import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHrFormSubmissions } from "../hooks/useHrFormSubmissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { Input } from "@/components/ui/Input";
import { Eye, FileText } from "lucide-react";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { formatDateShort } from "@/utils/formatDate";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Submitted: getStatusBadgeClass("info"),
    Reviewed: getStatusBadgeClass("success"),
  };
  return <Badge className={map[s] || ""}>{s}</Badge>;
};

const HrFormSubmissionsPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [search, setSearch] = useState("");

  const { data: submissionsResult, isLoading } = useHrFormSubmissions(page, Number(pageSize), search);
  const submissions = submissionsResult?.data ?? [];
  const total = submissionsResult?.pagination?.total ?? 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">Form Submissions</h1><p className="text-sm text-muted-foreground">Review employee form submissions</p></div>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Input placeholder="Search employee or form..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-64" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader message="Loading submissions..." />
          ) : submissions.length === 0 ? (
            <EmptyState message="No submissions yet" description="Submissions will appear here once employees fill out forms." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                    <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Reviewed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.employee_name}<p className="text-xs text-muted-foreground">{s.employee_code}</p></TableCell>
                      <TableCell>{s.department || "-"}</TableCell>
                      <TableCell>{s.form_title}</TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                      <TableCell>{formatDateShort(s.submitted_at)}</TableCell>
                      <TableCell>{s.reviewed_at ? formatDateShort(s.reviewed_at) : "-"}</TableCell>
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
    </div>
  );
};

export default HrFormSubmissionsPage;
