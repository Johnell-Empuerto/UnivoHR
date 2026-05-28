import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { exportReport } from "@/services/reportService";
import { toast } from "sonner";

interface ExportButtonProps {
  reportCategory: string;
  reportType: string;
  filters?: Record<string, any>;
  disabled?: boolean;
}

const ExportButton = ({ reportCategory, reportType, filters = {}, disabled }: ExportButtonProps) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportReport({
        reportCategory,
        reportType,
        ...filters,
      });

      if (blob.size === 0) {
        toast.error("No data to export");
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportCategory}_${reportType}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || exporting}
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Export CSV
    </Button>
  );
};

export default ExportButton;
