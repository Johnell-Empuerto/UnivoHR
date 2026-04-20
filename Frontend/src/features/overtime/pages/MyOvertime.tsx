// features/overtime/pages/MyOvertime.tsx
import { useEffect, useState } from "react";
import {
  getMyOvertime,
  createOvertime,
  getOvertimeDetails,
} from "@/services/overtimeService";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, RefreshCw, Clock, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import OvertimeForm from "../components/OvertimeForm";
import OvertimeTable from "../components/OvertimeTable";
import OvertimeDrawer from "../components/OvertimeDrawer";
import { toast } from "sonner";

type OvertimeRequest = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejected_reason?: string | null;
};

const MyOvertime = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [data, setData] = useState<OvertimeRequest[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getMyOvertime(
          currentPage,
          rowsPerPage,
          search,
          statusFilter,
        );
        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      } catch (err: any) {
        setError(err.message || "Failed to fetch overtime requests");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, rowsPerPage, search, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
  };

  const handleCreateOvertime = async (formData: any) => {
    try {
      setSubmitting(true);
      await createOvertime(formData);
      toast.success("Overtime request submitted successfully");
      setIsModalOpen(false);
      // Refresh data
      setCurrentPage(1);
      const res = await getMyOvertime(1, rowsPerPage, search, statusFilter);
      setData(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit overtime request");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view drawer
  const handleView = async (request: OvertimeRequest) => {
    try {
      const details = await getOvertimeDetails(request.id);
      setSelectedRequest(details);
      setIsDrawerOpen(true);
    } catch (err: any) {
      toast.error("Failed to load request details");
    }
  };

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-muted-foreground">
              My Overtime
            </h1>
            <p className="text-sm text-muted-foreground">
              Submit and track your overtime requests
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Apply Overtime
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reason..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {(searchInput || statusFilter) && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}

            <Button onClick={handleRefresh} variant="ghost">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">
            Loading overtime requests...
          </span>
        </div>
      )}

      {/* Overtime Table with onView handler */}
      <OvertimeTable
        data={data}
        onView={handleView}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        rowsPerPage={rowsPerPage}
        title="My Overtime Requests"
      />

      {/* Create Overtime Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg! w-full sm:max-w-lg!">
          <DialogHeader>
            <DialogTitle>Apply Overtime</DialogTitle>
            <DialogDescription>
              Fill in the details for your overtime request
            </DialogDescription>
          </DialogHeader>
          <OvertimeForm
            onSubmit={handleCreateOvertime}
            isLoading={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Overtime Drawer for viewing details */}
      <OvertimeDrawer
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </div>
  );
};

export default MyOvertime;
