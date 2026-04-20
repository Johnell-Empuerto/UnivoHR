import CreditLeaveTable from "../components/CreditLeaveTable";
import { CalendarDays } from "lucide-react";

const CreditLeavePage = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header - Matching consistent theme */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            Leave Credits & History
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your leave balances and view your leave transaction history
          </p>
        </div>
      </div>

      {/* Credit Leave Table */}
      <CreditLeaveTable />
    </div>
  );
};

export default CreditLeavePage;
