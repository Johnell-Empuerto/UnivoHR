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
import { getAssignableUsers } from "@/services/applicantService";

interface AssignableUser {
  user_id: number;
  username: string;
  employee_id: number | null;
  name: string;
  employee_code: string;
  department: string | null;
  position: string | null;
  employee_status: string;
  branch_name: string | null;
}

interface UserPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (user: AssignableUser | null) => void;
  selectedUserId?: number | null;
  includeNotAssigned?: boolean;
  title?: string;
}

const ITEMS_PER_PAGE = 20;

const UserPickerDialog = ({
  open,
  onOpenChange,
  onSelect,
  selectedUserId,
  includeNotAssigned = false,
  title = "Select User",
}: UserPickerDialogProps) => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AssignableUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const res = await getAssignableUsers(p, ITEMS_PER_PAGE, s);
      setData(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      fetchUsers(page, search);
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [open, page, search, fetchUsers]);

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
              placeholder="Search by name or employee code..."
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
                No users found
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted sticky top-0">
                    <TableHead>Name</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((user) => (
                    <TableRow
                      key={user.user_id}
                      className={`cursor-pointer hover:bg-accent ${selectedUserId === user.user_id ? "bg-accent" : ""}`}
                      onClick={() => {
                        onSelect(user);
                        onOpenChange(false);
                      }}
                    >
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="font-mono text-xs">{user.employee_code}</TableCell>
                      <TableCell>{user.department || "-"}</TableCell>
                      <TableCell>{user.position || "-"}</TableCell>
                      <TableCell>{user.branch_name || "-"}</TableCell>
                      <TableCell>{user.employee_status}</TableCell>
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
          {includeNotAssigned && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  onSelect(null);
                  onOpenChange(false);
                }}
              >
                Clear selection (Not assigned)
              </Button>
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

export default UserPickerDialog;
