// features/payroll/components/PayrollSummary.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Gift,
} from "lucide-react";

interface PayrollSummaryProps {
  summary: {
    total_employees: number;
    total_payout: number;
    total_deductions: number;
    total_leave_conversion?: number;
    average_salary?: number;
  };
}

const PayrollSummary = ({ summary }: PayrollSummaryProps) => {
  const averageSalary =
    summary.total_employees > 0
      ? summary.total_payout / summary.total_employees
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {" "}
      {/*  CHANGE FROM 4 TO 5 */}
      <Card className="border-border/50 shadow-sm bg-linear-to-br from-green-50/50 to-transparent dark:from-green-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{summary.total_employees}</div>
            <Users className="h-8 w-8 text-green-600 dark:text-green-500 opacity-70" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 shadow-sm bg-linear-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Payout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              ₱{summary.total_payout.toLocaleString()}
            </div>
            <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-500 opacity-70" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 shadow-sm bg-linear-to-br from-red-50/50 to-transparent dark:from-red-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Deductions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              ₱{summary.total_deductions.toLocaleString()}
            </div>
            <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-500 opacity-70" />
          </div>
        </CardContent>
      </Card>
      {/*  ADD LEAVE CONVERSION CARD */}
      <Card className="border-border/50 shadow-sm bg-linear-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Leave Conversion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-purple-600">
              ₱{summary.total_leave_conversion?.toLocaleString() || 0}
            </div>
            <Gift className="h-8 w-8 text-purple-600 dark:text-purple-500 opacity-70" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Unused leave converted
          </p>
        </CardContent>
      </Card>
      <Card className="border-border/50 shadow-sm bg-linear-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average Salary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              ₱{averageSalary.toLocaleString()}
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-500 opacity-70" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollSummary;
