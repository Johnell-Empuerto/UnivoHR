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
import { getJobPositions } from "@/services/jobPositionService";

interface JobPositionResult {
  id: number;
  title: string;
  department: string | null;
  branch_name: string | null;
  workflow_name: string | null;
  status: string;
}

interface JobPositionPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (position: JobPositionResult) => void;
  selectedId?: number | null;
}

const ITEMS_PER_PAGE = 20;

const JobPositionPickerDialog = ({
  open,
  onOpenChange,
  onSelect,
  selectedId,
}: JobPositionPickerDialogProps) => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<JobPositionResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchPositions = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const res = await getJobPositions(p, ITEMS_PER_PAGE, s, "ACTIVE");
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
      fetchPositions(page, search);
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [open, page, search, fetchPositions]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Job Position</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title or department..."
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
                No job positions found
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted sticky top-0">
                    <TableHead>Job Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((pos) => (
                    <TableRow
                      key={pos.id}
                      className={`cursor-pointer hover:bg-accent ${selectedId === pos.id ? "bg-accent" : ""}`}
                      onClick={() => {
                        onSelect(pos);
                        onOpenChange(false);
                      }}
                    >
                      <TableCell className="font-medium">{pos.title}</TableCell>
                      <TableCell>{pos.department || "-"}</TableCell>
                      <TableCell>{pos.branch_name || "-"}</TableCell>
                      <TableCell>{pos.workflow_name || "-"}</TableCell>
                      <TableCell>{pos.status}</TableCell>
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

export default JobPositionPickerDialog;
