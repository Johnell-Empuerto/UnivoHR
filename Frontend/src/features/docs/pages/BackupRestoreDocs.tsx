import { CheckCircle2, Server } from "lucide-react";
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

const BackupRestoreDocs = () => (
  <div className="space-y-8">
    <section id="backup-restore" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Backup and Restore Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            How to backup the database and restore when needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Server className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">System Administrator</Badge>
              <Badge variant="secondary">IT</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Creating a database backup
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Use the database management tool (e.g., mysqldump for MySQL):
                <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                  mysqldump -u username -p database_name &gt;
                  backup_YYYYMMDD.sql
                </pre>
              </li>
              <li className="leading-relaxed pl-1">
                Store the backup file in a secure off-site location (cloud
                storage, external drive).
              </li>
              <li className="leading-relaxed pl-1">
                Schedule regular automated backups using cron jobs or
                Windows Task Scheduler.
              </li>
              <li className="leading-relaxed pl-1">
                Also backup the <code>.env</code> configuration file,
                uploaded files (e.g., employee photos, attachments), and
                the frontend build.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Restoring a backup</h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Stop any running application processes.
              </li>
              <li className="leading-relaxed pl-1">
                Restore the database:
                <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                  mysql -u username -p database_name &lt;
                  backup_YYYYMMDD.sql
                </pre>
              </li>
              <li className="leading-relaxed pl-1">
                Restore the <code>.env</code> file and uploaded files from
                the backup.
              </li>
              <li className="leading-relaxed pl-1">
                Verify the application starts and data is intact.
              </li>
            </ol>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/backup-restore" />
  </div>
);

export default BackupRestoreDocs;
