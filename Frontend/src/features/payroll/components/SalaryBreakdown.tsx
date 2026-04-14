import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

//  CURRENCY FORMATTER
const formatCurrency = (value: number) => {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

//  Helper to format employee name
const formatEmployeeName = (record: any) => {
  if (record.first_name && record.last_name) {
    return `${record.first_name} ${record.middle_name || ""} ${record.last_name}${record.suffix ? `, ${record.suffix}` : ""}`.trim();
  }
  return record.name || "";
};

//  Helper function to format deduction labels
const formatDeductionLabel = (type: string) => {
  switch (type.toUpperCase()) {
    case "SSS":
      return "SSS";
    case "PHILHEALTH":
      return "PhilHealth";
    case "PAGIBIG":
      return "Pag-IBIG";
    case "TAX":
      return "Withholding Tax";
    case "LOAN":
      return "Loan";
    case "OTHER":
      return "Other";
    default:
      return type;
  }
};

interface SalaryBreakdownProps {
  record: {
    name: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    suffix?: string;
    employee_code: string;
    basic_salary: number;
    monthly_salary?: number;
    overtime_pay: number;
    leave_conversion?: number;
    late_deduction: number;
    absent_deduction: number;
    government_deduction: number;
    deductions: number;
    net_salary: number;
    deductions_list?: Array<{ type: string; amount: string | number }>;
  };
}

const SalaryBreakdown = ({ record }: SalaryBreakdownProps) => {
  //  Use monthly_salary if available, otherwise fallback to basic_salary
  const monthlySalary = record.monthly_salary || record.basic_salary;
  const cutoffSalary = record.basic_salary;
  const deductionPercentage = (record.deductions / monthlySalary) * 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Salary Breakdown
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatEmployeeName(record)} ({record.employee_code})
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/*  UPDATED: Show Monthly Salary with note */}
          <div>
            <div className="flex justify-between mb-2">
              <div>
                <span className="text-sm font-medium">Monthly Salary</span>
                <p className="text-xs text-muted-foreground">
                  Your full monthly rate
                </p>
              </div>
              <span className="text-sm font-semibold text-blue-600">
                ₱{formatCurrency(monthlySalary)}
              </span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          {/*  NEW: Show Cutoff Salary (what they actually earned) */}
          {cutoffSalary !== monthlySalary && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex justify-between mb-1">
                <div>
                  <span className="text-sm font-medium">
                    This Cutoff Earnings
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Based on actual work days (
                    {((cutoffSalary / monthlySalary) * 100).toFixed(0)}% of
                    monthly)
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  ₱{formatCurrency(cutoffSalary)}
                </span>
              </div>
            </div>
          )}

          {/* Overtime Pay */}
          {record.overtime_pay > 0 && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-green-600">
                  Overtime Pay
                </span>
                <span className="text-sm font-semibold text-green-600">
                  +₱{formatCurrency(record.overtime_pay)}
                </span>
              </div>
            </div>
          )}

          {/* Leave Conversion */}
          {record.leave_conversion && record.leave_conversion > 0 && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-blue-600">
                  🎉 Leave Conversion
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  +₱{formatCurrency(record.leave_conversion)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Unused vacation leave converted to cash
              </p>
            </div>
          )}

          {/* Deductions Section */}
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium text-red-600">Deductions</p>

            {/* Late Deductions */}
            {record.late_deduction > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Late Deductions</span>
                <span className="text-red-600">
                  -₱{formatCurrency(record.late_deduction)}
                </span>
              </div>
            )}

            {/* Absent Deductions */}
            {record.absent_deduction > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Absent Deductions</span>
                <span className="text-red-600">
                  -₱{formatCurrency(record.absent_deduction)}
                </span>
              </div>
            )}

            {/* Itemized Government Contributions */}
            {record.deductions_list && record.deductions_list.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-sm font-medium text-red-600">
                  Government Contributions
                </p>
                <div className="pl-4 space-y-1">
                  {record.deductions_list.map((d: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatDeductionLabel(d.type)}
                      </span>
                      <span className="text-red-600">
                        -₱{formatCurrency(Number(d.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback government deduction */}
            {(!record.deductions_list || record.deductions_list.length === 0) &&
              record.government_deduction > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Government Contributions
                  </span>
                  <span className="text-red-600">
                    -₱{formatCurrency(record.government_deduction)}
                  </span>
                </div>
              )}
          </div>

          {/* Total Deductions */}
          <div className="pt-2 border-t">
            <div className="flex justify-between font-medium">
              <span>Total Deductions</span>
              <span className="text-red-600">
                -₱{formatCurrency(record.deductions)}
              </span>
            </div>
            <div className="mt-1">
              <Progress
                value={deductionPercentage}
                className="h-2 bg-red-200"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {deductionPercentage.toFixed(1)}% of monthly salary
              </p>
            </div>
          </div>

          {/* Net Salary */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Net Salary</span>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-base px-3 py-1">
                ₱{formatCurrency(record.net_salary)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaryBreakdown;
