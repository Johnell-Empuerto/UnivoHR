import { CheckCircle2, Clock, Users } from "lucide-react";
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

const MyAttendanceClockDocs = () => (
  <div className="space-y-8">
    <section id="my-attendance-clock" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            My Attendance / Clock In-Out Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to clock in and out, view your attendance records,
            and request corrections as an employee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">All Employees</Badge>
              <Badge variant="outline">After user account is created</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Clocking in and out
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, click <strong>Attendance</strong>. The page
                shows your attendance for today.
              </li>
              <li className="leading-relaxed pl-1">
                A large clock display shows the current time. Below it, click{" "}
                <strong>Clock In</strong> to record your arrival.
              </li>
              <li className="leading-relaxed pl-1">
                At the end of your shift, click <strong>Clock Out</strong> to
                record your departure.
              </li>
              <li className="leading-relaxed pl-1">
                Your current attendance status updates in real time (e.g.,
                Present, Late, On Break).
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Viewing your attendance history
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Below the clock, your recent attendance records are listed in
                a table.
              </li>
              <li className="leading-relaxed pl-1">
                Use the month filter or date range to view past attendance.
              </li>
              <li className="leading-relaxed pl-1">
                Each row shows: Date, Schedule, Clock In time, Clock Out time,
                Status (Present, Late, Absent, etc.), and Hours Worked.
              </li>
              <li className="leading-relaxed pl-1">
                If you notice an error, use the{" "}
                <strong>Request Correction</strong> button to submit a
                correction request to HR.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/my-attendance-clock" />
  </div>
);

export default MyAttendanceClockDocs;
