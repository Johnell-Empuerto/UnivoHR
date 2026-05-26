import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getAnomalyById, updateAnomalyStatus } from "@/services/anomalyService";
import type { Anomaly } from "@/services/anomalyService";
import { toast } from "sonner";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  User,
  Building2,
  Calendar,
  Tag,
  FileText,
  Activity,
} from "lucide-react";

const severityConfig: Record<string, { label: string; variant: "destructive" | "default" | "secondary" }> = {
  HIGH: { label: "HIGH", variant: "destructive" },
  MEDIUM: { label: "MEDIUM", variant: "default" },
  LOW: { label: "LOW", variant: "secondary" },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  OPEN: { label: "Open", variant: "default" },
  REVIEWED: { label: "Reviewed", variant: "secondary" },
  RESOLVED: { label: "Resolved", variant: "outline" },
};

const moduleIcons: Record<string, any> = {
  attendance: Clock,
  overtime: Activity,
  payroll: FileText,
  leaves: Calendar,
  man_hours: FileText,
  time_modification: Clock,
};

interface Props {
  anomalyId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: () => void;
}

const AnomalyDetailDrawer = ({ anomalyId, open, onOpenChange, onStatusUpdate }: Props) => {
  const [anomaly, setAnomaly] = useState<Anomaly | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open && anomalyId) {
      setLoading(true);
      getAnomalyById(anomalyId)
        .then(setAnomaly)
        .catch(() => toast.error("Failed to load anomaly details"))
        .finally(() => setLoading(false));
    } else {
      setAnomaly(null);
    }
  }, [open, anomalyId]);

  const handleStatusUpdate = async (status: "REVIEWED" | "RESOLVED") => {
    if (!anomalyId) return;
    setUpdating(true);
    try {
      await updateAnomalyStatus(anomalyId, status);
      toast.success(`Anomaly marked as ${status.toLowerCase()}`);
      onStatusUpdate();
      setAnomaly((prev) => prev ? { ...prev, status } : prev);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const SeverityBadge = severityConfig[anomaly?.severity || "MEDIUM"];
  const StatusBadge = statusConfig[anomaly?.status || "OPEN"];
  const ModuleIcon = moduleIcons[anomaly?.source_module || "attendance"];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            {anomaly?.severity === "HIGH" && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {loading ? <Skeleton className="h-6 w-64" /> : anomaly?.title || "Anomaly Details"}
          </DrawerTitle>
          <DrawerDescription>Anomaly #{anomalyId}</DrawerDescription>
        </DrawerHeader>

        <div className="px-6 pb-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : anomaly ? (
            <>
              {/* Badges Row */}
              <div className="flex flex-wrap gap-2">
                <Badge variant={SeverityBadge.variant}>{SeverityBadge.label}</Badge>
                <Badge variant={StatusBadge.variant}>{StatusBadge.label}</Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <ModuleIcon className="h-3 w-3" />
                  {anomaly.source_module.replace("_", " ")}
                </Badge>
                <Badge variant="outline">{anomaly.anomaly_type.replace(/_/g, " ")}</Badge>
              </div>

              {/* Description */}
              {anomaly.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{anomaly.description}</p>
                </div>
              )}

              {/* Detected vs Expected */}
              <div className="grid grid-cols-2 gap-4">
                {anomaly.detected_value && (
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <p className="text-xs text-muted-foreground mb-1">Detected Value</p>
                    <p className="text-sm font-medium text-destructive">{anomaly.detected_value}</p>
                  </div>
                )}
                {anomaly.expected_value && (
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <p className="text-xs text-muted-foreground mb-1">Expected Value</p>
                    <p className="text-sm font-medium text-green-600">{anomaly.expected_value}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Employee</p>
                    <p className="font-medium">{anomaly.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{anomaly.employee_code}</p>
                  </div>
                </div>
                {anomaly.branch_name && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Branch</p>
                      <p className="font-medium">{anomaly.branch_name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Detected At</p>
                    <p className="font-medium">{formatDate(anomaly.detected_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Source</p>
                    <p className="font-medium capitalize">{anomaly.source_module.replace("_", " ")}</p>
                  </div>
                </div>
                {anomaly.reviewer_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Reviewed By</p>
                      <p className="font-medium">{anomaly.reviewer_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(anomaly.reviewed_at)}</p>
                    </div>
                  </div>
                )}
                {anomaly.resolver_name && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Resolved By</p>
                      <p className="font-medium">{anomaly.resolver_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(anomaly.resolved_at)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata */}
              {anomaly.metadata && Object.keys(anomaly.metadata).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Metadata</h4>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(anomaly.metadata, null, 2)}
                    </pre>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              {anomaly.status === "OPEN" && (
                <div className="flex gap-3">
                  <Button
                    variant="default"
                    onClick={() => handleStatusUpdate("REVIEWED")}
                    disabled={updating}
                    className="flex-1"
                  >
                    {updating ? "Updating..." : "Mark as Reviewed"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate("RESOLVED")}
                    disabled={updating}
                    className="flex-1"
                  >
                    {updating ? "Updating..." : "Mark as Resolved"}
                  </Button>
                </div>
              )}
              {anomaly.status === "REVIEWED" && (
                <Button
                  variant="default"
                  onClick={() => handleStatusUpdate("RESOLVED")}
                  disabled={updating}
                  className="w-full"
                >
                  {updating ? "Updating..." : "Mark as Resolved"}
                </Button>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">Anomaly not found</p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AnomalyDetailDrawer;
