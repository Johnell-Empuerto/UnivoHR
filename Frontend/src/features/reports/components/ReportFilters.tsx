import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";

interface ReportFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  children?: React.ReactNode;
}

const ReportFilters = ({ search, onSearchChange, onRefresh, children }: ReportFiltersProps) => {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      {children}
      <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ReportFilters;
