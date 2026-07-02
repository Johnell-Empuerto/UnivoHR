// features/users/components/UsersTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { TablePagination } from "@/components/shared/TablePagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import { formatDateShort } from "@/utils/formatDate";
import type { User } from "@/services/userService";

type UsersTableProps = {
  data: User[];
  onEdit: (user: User) => void;
  onDelete: (id: number, username: string) => void;
  canManage: boolean;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  rowsPerPage: number;
  title?: string;
};

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge variant="default" className="bg-purple-500">
            ADMIN
          </Badge>
        );
      default:
        return <Badge variant="outline">EMPLOYEE</Badge>;
    }
  };

const getFullName = (user: User) => {
  const parts = [
    user.first_name,
    user.middle_name,
    user.last_name,
    user.suffix ? `, ${user.suffix}` : "",
  ].filter(Boolean);
  return parts.join(" ").replace(/\s+,/, ",") || user.username;
};

const UsersTable = ({
  data,
  onEdit,
  onDelete,
  canManage,
  currentPage,
  totalPages,
  totalRecords,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPage,
  title = "User Accounts",
}: UsersTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Username</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Employee Code</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-b border-gray-400/50 dark:border-gray-400/50"
                  >
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell>{getFullName(user)}</TableCell>
                    <TableCell>{user.employee_code || "-"}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user.department || "-"}</TableCell>
                    <TableCell>
                      {formatDateShort(user.created_at)}
                    </TableCell>
                    <TableCell>
                      {canManage && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onEdit(user)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => onDelete(user.id, user.username)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <EmptyState message="No users found" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={totalRecords}
          pageSize={rowsPerPage}
          onPageChange={(p) => onPageChange(p)}
          onPageSizeChange={(size) => { onRowsPerPageChange(size); onPageChange(1); }}
        />
      </CardContent>
    </Card>
  );
};

export default memo(UsersTable);
