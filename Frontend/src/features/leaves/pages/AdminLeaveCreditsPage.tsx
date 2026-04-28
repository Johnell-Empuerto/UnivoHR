import EmployeeCreditsTable from "../components/EmployeeCreditsTable";
import { CalendarDays } from "lucide-react";

const AdminLeaveCreditsPage = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header - Matching consistent theme */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            Manage Employee Leave Credits
          </h1>
          <p className="text-sm text-muted-foreground">
            View and update leave credit allocations for all employees
          </p>
        </div>
      </div>

      {/* Employee Credits Table */}
      <EmployeeCreditsTable />
    </div>
  );
};

export default AdminLeaveCreditsPage;
