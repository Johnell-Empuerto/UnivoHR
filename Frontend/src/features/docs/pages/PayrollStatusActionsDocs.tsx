import { AlertTriangle, CheckCircle2, Info, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DocsNavigation from "../components/DocsNavigation";

const PayrollStatusActionsDocs = () => (
  <div className="space-y-8">
    <section id="payroll-status-actions" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Payroll Status Actions Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Control the payroll lifecycle by marking batches as paid, deleting
            unpaid records, and managing payroll status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Administrator</Badge>
              <Badge variant="secondary">Payroll Admin</Badge>
              <Badge variant="outline">After payroll is generated</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Available batch actions
              </h3>
            </div>
            <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Mark Batch Paid:</strong> Click{" "}
                <strong>Mark Batch Paid</strong> on a payroll batch card. A
                confirmation dialog asks you to confirm. All employee records
                in that batch are marked as PAID. This can be reverted by
                marking individual records as unpaid.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Delete Batch:</strong> Click{" "}
                <strong>Delete Batch</strong> to permanently remove an unpaid
                payroll batch. Only available when no records in the batch
                have PAID status. A confirmation dialog warns this cannot be
                undone.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">
                Status indicators
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>PAID</strong> — green badge. Payroll has been marked
                as paid.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>UNPAID</strong> — yellow badge. Payroll is generated
                but not yet paid.
              </li>
              <li className="leading-relaxed pl-1">
                The <strong>Mark Batch Paid</strong> button is disabled once
                all records in a batch are already PAID.
              </li>
              <li className="leading-relaxed pl-1">
                The <strong>Delete Batch</strong> button is disabled if any
                record in the batch has PAID status.
              </li>
              <li className="leading-relaxed pl-1">
                Payroll Summary cards at the top show totals: Gross Pay,
                Total Deductions, Net Pay, and number of employees.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-sm">Important notes</h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Deleting a batch removes all payroll records in that cutoff
                period. Regenerate using the{" "}
                <strong>Generate Payroll</strong> tab.
              </li>
              <li className="leading-relaxed pl-1">
                Use the <strong>Branch</strong> filter and{" "}
                <strong>Payroll Period</strong> selector to narrow down
                batches.
              </li>
              <li className="leading-relaxed pl-1">
                The <strong>Refresh</strong> button reloads the current data.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/payroll-status-actions" />
  </div>
);

export default PayrollStatusActionsDocs;
