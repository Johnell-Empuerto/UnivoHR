import { AlertTriangle, CheckCircle2, Info, Server } from "lucide-react";
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

const DeploymentDocs = () => (
  <div className="space-y-8">
    <section id="deployment" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Deployment Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Install and configure UnivoHR on a server for production use.
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
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Prerequisites</h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                A server running a supported OS (Linux Ubuntu 20.04+ or
                Windows Server 2019+).
              </li>
              <li className="leading-relaxed pl-1">
                PHP 8.1+ with required extensions (for the Laravel backend).
              </li>
              <li className="leading-relaxed pl-1">
                Node.js 18+ and npm (for the React frontend build).
              </li>
              <li className="leading-relaxed pl-1">
                MySQL 8.0+ or MariaDB 10.3+ database.
              </li>
              <li className="leading-relaxed pl-1">
                Web server: Nginx or Apache with SSL certificate.
              </li>
              <li className="leading-relaxed pl-1">
                SMTP server or email relay for sending notifications.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Deployment steps</h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Clone the repository to the server.
              </li>
              <li className="leading-relaxed pl-1">
                Set up the backend: configure <code>.env</code> with database
                credentials, run <code>composer install</code>, migrations,
                and seeders.
              </li>
              <li className="leading-relaxed pl-1">
                Build the frontend: run <code>npm install</code> and{" "}
                <code>npm run build</code> in the Frontend/ directory.
              </li>
              <li className="leading-relaxed pl-1">
                Configure the web server to serve the backend API and the
                built frontend assets.
              </li>
              <li className="leading-relaxed pl-1">
                Set up SSL certificate for HTTPS access.
              </li>
              <li className="leading-relaxed pl-1">
                Run database migrations and seed the initial admin account.
              </li>
              <li className="leading-relaxed pl-1">
                Test the deployment by logging in with the admin account.
              </li>
            </ol>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/deployment" />
  </div>
);

export default DeploymentDocs;
