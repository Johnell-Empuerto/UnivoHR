// features/users/pages/Users.tsx
import { useEffect, useState } from "react";
import { UserCog, Search, Loader2, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import UsersTable from "../components/UsersTable";
import UserDrawerForm from "../components/UserDrawersForm";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
} from "@/services/userService";

const Users = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");

  // Debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await getUsers(
          currentPage,
          rowsPerPage,
          search,
          roleFilter,
        );
        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentPage, rowsPerPage, search, roleFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setRoleFilter("");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setSearchInput("");
    setSearch("");
    setRoleFilter("");
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setMode("create");
    setIsDrawerOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setMode("edit");
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: number, username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        await deleteUser(id);
        toast.success("User deleted successfully");
        // Refresh data
        const res = await getUsers(
          currentPage,
          rowsPerPage,
          search,
          roleFilter,
        );
        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete user");
      }
    }
  };

  // ✅ FIXED: Proper handleSubmit with API calls
  const handleSubmit = async (formData: any) => {
    try {
      if (mode === "create") {
        // 🔥 CREATE USER - API CALL
        await createUser({
          username: formData.username,
          password: formData.password,
          role: formData.role,
          employee_id: formData.employee_id,
        });
        toast.success("User created successfully");

        // Refresh to first page
        setCurrentPage(1);
        const res = await getUsers(1, rowsPerPage, search, roleFilter);
        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      } else {
        // 🔥 UPDATE USER - API CALL
        if (editingUser) {
          await updateUser(editingUser.id, {
            username: formData.username,
            role: formData.role,
            password: formData.password || undefined,
          });
          toast.success("User updated successfully");

          // Refresh current page
          const res = await getUsers(
            currentPage,
            rowsPerPage,
            search,
            roleFilter,
          );
          setData(res.data);
          setTotalPages(res.pagination.totalPages);
          setTotalRecords(res.pagination.total);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
      throw err; // Re-throw so drawer knows it failed
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCog className="h-5 w-5 text-primary dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">User Accounts</h1>
            <p className="text-sm text-muted-foreground">
              Manage system user accounts, roles, and permissions
            </p>
          </div>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or employee name..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>

            <Select
              value={roleFilter || "all"}
              onValueChange={handleRoleFilterChange}
            >
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
              </SelectContent>
            </Select>

            {(searchInput || roleFilter) && (
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
            Loading users...
          </span>
        </div>
      )}

      {/* Users Table */}
      <UsersTable
        data={data}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        rowsPerPage={rowsPerPage}
        title="User Accounts"
      />

      {/* User Drawer Form */}
      <UserDrawerForm
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        mode={mode}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Users;
