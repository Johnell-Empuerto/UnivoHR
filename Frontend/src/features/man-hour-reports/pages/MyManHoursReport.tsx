"use client";

import { useEffect, useState } from "react";
import {
  getMyManHourReports,
  createManHourReport,
  updateManHourReport,
  deleteManHourReport,
  getManHourReportDetails,
} from "@/services/manHourReportService";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, Plus, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ManHourReportTable from "../components/ManHourReportTable";
import ManHourReportDrawer from "../components/ManHourReportDrawer";
import { useAuth } from "@/app/providers/AuthProvider";

type ManHourReport = {
  id: number;
  employee_name?: string;
  employee_code?: string;
  employee_id?: number;
  work_date: string;
  task: string;
  hours: number;
  remarks?: string | null;
  created_at: string;
  status?: string;
};

const MyManHoursReport = () => {
  useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [data, setData] = useState<ManHourReport[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    work_date: "",
    task: "",
    hours: "",
    remarks: "",
  });
  const [formProcessing, setFormProcessing] = useState(false);

  // Drawer state
  const [selectedReport, setSelectedReport] = useState<ManHourReport | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getMyManHourReports(currentPage, rowsPerPage, search);

        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      } catch (err: any) {
        setError(err.message || "Failed to fetch man hour reports");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, rowsPerPage, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCurrentPage(1);
  };

  const handleOpenForm = () => {
    setFormData({
      work_date: new Date().toISOString().split("T")[0],
      task: "",
      hours: "",
      remarks: "",
    });
    setIsEditing(false);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setFormProcessing(true);
      await deleteManHourReport(deleteId);
      toast.success("Man hour report deleted");
      setIsDeleteDialogOpen(false);
      setDeleteId(null);

      // Refresh data
      const res = await getMyManHourReports(currentPage, rowsPerPage, search);
      setData(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete report");
    } finally {
      setFormProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.work_date || !formData.task || !formData.hours) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setFormProcessing(true);

      const submitData = {
        work_date: formData.work_date,
        task: formData.task,
        hours: parseFloat(formData.hours),
        remarks: formData.remarks || undefined,
      };

      if (isEditing && editingId) {
        await updateManHourReport(editingId, {
          task: submitData.task,
          hours: submitData.hours,
          remarks: submitData.remarks,
        });
        toast.success("Man hour report updated");
      } else {
        await createManHourReport(submitData);
        toast.success("Man hour report submitted");
      }

      setIsFormOpen(false);
      setFormData({
        work_date: "",
        task: "",
        hours: "",
        remarks: "",
      });

      // Refresh data
      const res = await getMyManHourReports(currentPage, rowsPerPage, search);
      setData(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      toast.error(err.message || "Failed to save report");
    } finally {
      setFormProcessing(false);
    }
  };

  const handleView = async (report: ManHourReport) => {
    try {
      const details = await getManHourReportDetails(report.id);
      setSelectedReport(details);
      setIsDrawerOpen(true);
    } catch (err: any) {
      toast.error("Failed to load report details");
    }
  };

  // Dummy handlers for table (not used for employee view)
  const handleApprove = () => {};
  const handleReject = () => {};

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Man Hours</h1>
            <p className="text-sm text-muted-foreground">
              Track and submit your daily man hour reports
            </p>
          </div>
        </div>
        <Button onClick={handleOpenForm} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Submit Report
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by task..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
            {searchInput && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">
            Loading man hour reports...
          </span>
        </div>
      )}

      {/* Man Hour Reports Table */}
      <ManHourReportTable
        data={data}
        onView={handleView}
        onApprove={handleApprove}
        onReject={handleReject}
        canApprove={false}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        rowsPerPage={rowsPerPage}
        title="My Reports"
      />

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Man Hour Report" : "Submit Man Hour Report"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your man hour report"
                : "Record your work hours for the day"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="work_date">Work Date *</Label>
                <Input
                  id="work_date"
                  type="date"
                  value={formData.work_date}
                  onChange={(e) =>
                    setFormData({ ...formData, work_date: e.target.value })
                  }
                  disabled={isEditing}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label htmlFor="hours">Hours Worked *</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  placeholder="e.g., 8"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="task">Task/Description *</Label>
                <Textarea
                  id="task"
                  placeholder="Describe what you worked on..."
                  rows={4}
                  value={formData.task}
                  onChange={(e) =>
                    setFormData({ ...formData, task: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  placeholder="Any additional notes..."
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formProcessing}>
                {formProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update" : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Man Hour Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this man hour report? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={formProcessing}
            >
              {formProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Drawer */}
      <ManHourReportDrawer
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
      />
    </div>
  );
};

export default MyManHoursReport;
