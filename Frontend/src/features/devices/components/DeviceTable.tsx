import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import type { Device } from "@/services/deviceIntegrationService";

type DeviceTableProps = {
  data: Device[];
  canManage: boolean;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  rowsPerPage: number;
  onEdit: (device: Device) => void;
  onDelete: (id: number) => void;
  loading: boolean;
};

const DeviceTable = ({
  data,
  canManage,
  currentPage,
  totalPages,
  totalRecords,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPage,
  onEdit,
  onDelete,
  loading,
}: DeviceTableProps) => {
  const colSpan = canManage ? 8 : 7;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge
            variant="default"
            className={getStatusBadgeClass("success")}
          >
            ACTIVE
          </Badge>
        );
      case "OFFLINE":
        return (
          <Badge
            variant="secondary"
            className={getStatusBadgeClass("warning")}
          >
            OFFLINE
          </Badge>
        );
      case "INACTIVE":
        return (
          <Badge
            variant="secondary"
            className={getStatusBadgeClass("neutral")}
          >
            INACTIVE
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Logs</TableHead>
              {canManage && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: colSpan }).map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Logs</TableHead>
              {canManage && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((d) => (
                <TableRow
                  key={d.id}
                  className="border-b border-gray-400/50 dark:border-gray-400/50"
                >
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{d.type}</Badge>
                  </TableCell>
                  <TableCell>{d.ip_address || "\u2014"}</TableCell>
                  <TableCell>{d.location || "\u2014"}</TableCell>
                  <TableCell>
                    {d.branch_name ? (
                      <span className="text-xs" title={d.branch_timezone || ""}>
                        {d.branch_name}
                        {d.branch_timezone
                          ? ` (${d.branch_timezone})`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        No branch assigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(d.status)}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {d.total_logs ?? 0} total
                      {(d.pending_logs ?? 0) > 0 && (
                        <span className="ml-1 text-amber-500">
                          ({d.pending_logs} pending)
                        </span>
                      )}
                    </span>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(d)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(d.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-8">
                  <EmptyState message="No devices configured" />
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
        onPageChange={onPageChange}
        onPageSizeChange={(size) => { onRowsPerPageChange(size); onPageChange(1); }}
      />
    </>
  );
};

export default DeviceTable;
