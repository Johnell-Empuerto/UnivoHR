import { useQueryClient } from "@tanstack/react-query";
import { useEmployeeList } from "@/hooks/useEmployeeList";
import { useActiveBranches } from "@/hooks/useBranches";
import { useEffect, useState } from "react";
import EmployeeTable from "../components/EmployeeTable";
import ErrorMessage from "@/components/shared/ErrorMessage";
import Loader from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, RefreshCw, Users, Building2 } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Employee = {
  id: number;
  name: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
  employee_code: string;
  department: string;
  position: string;
  status: string;
  rfid_tag?: string | null;
  fingerprint_id?: string | null;
  birthday?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  contact_number?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_number?: string | null;
  emergency_contact_address?: string | null;
  emergency_contact_relation?: string | null;
  hired_date?: string | null;
  created_at?: string | null;
  profile_image?: string | null;
  sss_number?: string | null;
  philhealth_number?: string | null;
  hdmf_number?: string | null;
  tin_number?: string | null;
  resignation_date?: string | null;
  termination_date?: string | null;
  last_working_date?: string | null;
  final_pay_processed?: boolean;
};

const EmployeeList = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canCreate = user?.role === "ADMIN";
  const canEdit = user?.role === "ADMIN";
  const canView = canCreate || hasPermission("employees.view");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [data, setData] = useState<Employee[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const { data: branches = [] } = useActiveBranches();
  const [loading, setLoading] = useState(true);
  const [error] = useState("");

  const { data: queryData, isFetching } = useEmployeeList(
    currentPage, rowsPerPage, search, statusFilter, branchFilter,
  );

  const totalPages = queryData?.pagination?.totalPages ?? 1;
  const totalRecords = queryData?.pagination?.total ?? 0;

  // Sync data from query
  useEffect(() => {
    if (queryData?.data) {
      setData(queryData.data);
      setLoading(false);
    }
  }, [queryData]);

  useEffect(() => {
    if (isFetching && data.length > 0) {
      setLoading(true);
    }
  }, [isFetching, data.length]);

  // Debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleBranchChange = (value: string) => {
    setBranchFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setBranchFilter("");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setBranchFilter("");
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  const handleUpdate = (updated: Employee) => {
    setData((prev) =>
      prev.map((emp) => (emp.id === updated.id ? updated : emp)),
    );
  };

  const handleCreate = (newEmp: Employee) => {
    if (currentPage === 1) {
      setData((prev) => [newEmp, ...prev]);
    } else {
      setCurrentPage(1);
    }
  };

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            Employees
          </h1>
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? "Manage employee records, profiles, and status."
              : "View employee records and profiles."}
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or employee code..."
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="RESIGNED">Resigned</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={branchFilter || "all"}
              onValueChange={handleBranchChange}
            >
              <SelectTrigger className="w-37.5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <SelectValue placeholder="All Branches" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b: { id: number; name: string }) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchInput || statusFilter || branchFilter) && (
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

      {loading && <Loader message="Loading employees..." />}

      <EmployeeTable
        data={data}
        onUpdate={handleUpdate}
        onCreate={handleCreate}
        canEdit={canEdit}
        canCreate={canCreate}
        canView={canView}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
};

export default EmployeeList;
