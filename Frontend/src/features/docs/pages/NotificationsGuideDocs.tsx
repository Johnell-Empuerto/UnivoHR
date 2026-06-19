import { CheckCircle2, Bell, Users } from "lucide-react";
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

const NotificationsGuideDocs = () => (
  <div className="space-y-8">
    <section id="notifications-guide" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Notifications Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            View and manage your in-app notifications for approvals, alerts,
            and system updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">All Employees</Badge>
              <Badge variant="outline">After notification settings are configured</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Accessing notifications
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Click the <strong>bell icon</strong> in the top navigation bar.
                A dropdown shows your recent notifications.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>View All</strong> at the bottom to open the full{" "}
                <strong>Notifications</strong> page.
              </li>
              <li className="leading-relaxed pl-1">
                Alternatively, from the sidebar click{" "}
                <strong>Notifications</strong>.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing notifications
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Notifications are grouped by type: leave approvals, overtime
                approvals, payroll alerts, system announcements.
              </li>
              <li className="leading-relaxed pl-1">
                Unread notifications are marked with a blue dot. Click any
                notification to mark it as read and navigate to the relevant
                page.
              </li>
              <li className="leading-relaxed pl-1">
                The bell icon badge shows the count of unread notifications.
              </li>
              <li className="leading-relaxed pl-1">
                Email notifications are also sent based on your notification
                preferences set by HR.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/notifications-guide" />
  </div>
);

export default NotificationsGuideDocs;
