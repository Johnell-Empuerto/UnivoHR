import { CheckCircle2, FileText } from "lucide-react";
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

const MyFormsDocs = () => (
  <div className="space-y-8">
    <section id="my-forms" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">My Forms Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Complete and submit HR forms assigned to you by HR
            administrators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">All Employees</Badge>
              <Badge variant="outline">After forms are assigned to you</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Completing an assigned form
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, click <strong>My Forms</strong>. The page
                lists all forms assigned to you.
              </li>
              <li className="leading-relaxed pl-1">
                Each entry shows: Form title, Due date, Status (Pending,
                Submitted), and Assigned date.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Fill Form</strong> or the form name to open it.
              </li>
              <li className="leading-relaxed pl-1">
                Answer each question:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Short Text / Long Text</strong> — type your
                    answer
                  </li>
                  <li>
                    <strong>Number</strong> — enter a numeric value
                  </li>
                  <li>
                    <strong>Date</strong> — pick a date
                  </li>
                  <li>
                    <strong>Dropdown / Radio</strong> — select an option
                  </li>
                  <li>
                    <strong>Checkbox</strong> — select multiple options
                  </li>
                  <li>
                    <strong>Rating</strong> — choose 1-5 stars
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Once all required fields are filled, click{" "}
                <strong>Submit</strong>. Your responses are sent to HR for
                review.
              </li>
            </ol>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/my-forms" />
  </div>
);

export default MyFormsDocs;
