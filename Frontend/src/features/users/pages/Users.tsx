// features/users/pages/Users.tsx
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserCog, Search, RefreshCw, Plus } from "lucide-react";
import Loader from "@/components/shared/Loader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/app/providers/AuthProvider";
import UsersTable from "../components/UsersTable";
import UserDrawerForm from "../components/UserDrawersForm";
import {
  createUser,
  updateUser,
  deleteUser,
  type User,
} from "@/services/userService";
import { useUsersList } from "../hooks/useUsersList";

const Users = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("users.manage");
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    username: string;
  } | null>(null);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");

  const { data: usersData, isLoading, isFetching } = useUsersList(currentPage, rowsPerPage, search, roleFilter);
  const data = usersData?.data ?? [];
  const totalPages = usersData?.pagination?.totalPages ?? 1;
  const totalRecords = usersData?.pagination?.total ?? 0;

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
    queryClient.invalidateQueries({ queryKey: ["users-list"] });
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

  const handleDelete = (id: number, username: string) => {
    setDeleteTarget({ id, username });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (mode === "create") {
        await createUser({
          username: formData.username,
          password: formData.password,
          role: formData.role,
          employee_id: formData.employee_id,
        });
        toast.success("User created successfully");
        setCurrentPage(1);
        queryClient.invalidateQueries({ queryKey: ["users-list"] });
      } else {
        if (editingUser) {
          await updateUser(editingUser.id, {
            username: formData.username,
            role: formData.role,
            password: formData.password || undefined,
          });
          toast.success("User updated successfully");
          queryClient.invalidateQueries({ queryKey: ["users-list"] });
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
      throw err;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCog className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-muted-foreground">
              User Accounts
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage system user accounts, roles, and permissions
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        )}
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

      {(isLoading || isFetching) && <Loader message="Loading users..." />}

      {/* Users Table */}
      <UsersTable
        data={data}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canManage={canManage}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "{deleteTarget?.username}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
