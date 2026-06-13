import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { searchEmployeesPaginated } from "@/services/overtimeService";
import type { EmployeeSearchResult } from "@/services/overtimeService";

interface EmployeePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSelect: (employee: EmployeeSearchResult) => void;
  excludeEmployeeId?: number;
  activeOnly?: boolean;
  requireUserAccount?: boolean;
}

const ITEMS_PER_PAGE = 20;

const EmployeePickerDialog = ({
  open,
  onOpenChange,
  title,
  onSelect,
  excludeEmployeeId,
  activeOnly = true,
  requireUserAccount = false,
}: EmployeePickerDialogProps) => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<EmployeeSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const res = await searchEmployeesPaginated({
        page: p,
        limit: ITEMS_PER_PAGE,
        search: s,
        status: activeOnly ? "ACTIVE" : "",
        hasUser: requireUserAccount,
      });
      const filtered = excludeEmployeeId
        ? (res.data || []).filter((emp) => emp.id !== excludeEmployeeId)
        : (res.data || []);
      setData(filtered);
      setTotal(filtered.length < (res.data || []).length
        ? res.pagination.total - 1
        : res.pagination.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [excludeEmployeeId, activeOnly, requireUserAccount]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      fetchEmployees(page, search);
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [open, page, search, fetchEmployees]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee code, name, department..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-7 pr-7"
            />
            {search && (
              <X
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                onClick={() => { setSearch(""); setPage(1); }}
              />
            )}
          </div>
          <div className="rounded-md border max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No employees found
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted sticky top-0">
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Emp Status</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((emp) => (
                    <TableRow
                      key={emp.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => {
                        onSelect(emp);
                        onOpenChange(false);
                      }}
                    >
                      <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                      <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                      <TableCell>{emp.branch_name || "-"}</TableCell>
                      <TableCell>{emp.department || "-"}</TableCell>
                      <TableCell>{emp.position || "-"}</TableCell>
                      <TableCell>{emp.employment_status || "-"}</TableCell>
                      <TableCell>{emp.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          {total > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 px-2 text-xs"
                >
                  Next
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">{ITEMS_PER_PAGE} per page</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeePickerDialog;
