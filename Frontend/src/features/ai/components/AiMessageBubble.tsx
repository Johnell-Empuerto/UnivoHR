import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Bot, User, Ban } from "lucide-react";
import type { AiMessage } from "../types/ai.types";

interface AiMessageBubbleProps {
  message: AiMessage;
  onFeedback?: (messageId: number, rating: number) => void;
}

const intentLabels: Record<string, string> = {
  dashboard_summary: "Dashboard",
  attendance_summary: "Attendance",
  payroll_summary: "Payroll",
  anomaly_summary: "Anomaly",
  forecast_summary: "Forecast",
  late_employees: "Late",
  absence_summary: "Absence",
  employee_attendance: "Employee",
  employee_payroll: "Employee",
  employee_overtime: "Employee",
  employee_leave: "Employee",
  employee_late_records: "Employee",
  employee_anomalies: "Employee",
  employee_forecast: "Employee",
  employee_profile: "Employee",
  department_summary: "Department",
  branch_summary: "Branch",
};

const entityBadge = (metadata: Record<string, unknown>) => {
  const badges: { label: string; variant: "secondary" | "outline" }[] = [];
  if (metadata.employeeName) badges.push({ label: String(metadata.employeeName), variant: "secondary" });
  else if (metadata.employeeId) badges.push({ label: `Emp #${metadata.employeeId}`, variant: "secondary" });
  if (metadata.branchName) badges.push({ label: String(metadata.branchName), variant: "outline" });
  if (metadata.department) badges.push({ label: String(metadata.department), variant: "outline" });
  return badges;
};

export const AiMessageBubble = ({ message, onFeedback }: AiMessageBubbleProps) => {
  const isUser = message.role === "user";
  const isDenied = !isUser && message.content.toLowerCase().includes("do not have permission");
  const entities = message.metadata ? entityBadge(message.metadata) : [];

  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className={cn(
            "flex items-center justify-center size-8 rounded-full",
            isDenied ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            {isDenied ? <Ban className="size-4" /> : <Bot className="size-4" />}
          </div>
        </div>
      )}
      <div className={cn("max-w-[85%] space-y-1", isUser && "items-end flex flex-col")}>
        {!isUser && message.intent && intentLabels[message.intent] && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {intentLabels[message.intent]}
            </Badge>
            {entities.map((e, i) => (
              <Badge key={i} variant={e.variant} className="text-[10px] px-1.5 py-0 h-4">
                {e.label}
              </Badge>
            ))}
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : isDenied
                ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md"
                : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          {message.content}
        </div>
        {!isUser && onFeedback && !isDenied && (
          <div className="flex gap-1.5 pt-0.5">
            <button
              onClick={() => onFeedback(message.id, 5)}
              className="text-muted-foreground/40 hover:text-green-500 transition-colors"
              title="Helpful"
            >
              <ThumbsUp className="size-3" />
            </button>
            <button
              onClick={() => onFeedback(message.id, 1)}
              className="text-muted-foreground/40 hover:text-red-500 transition-colors"
              title="Not helpful"
            >
              <ThumbsDown className="size-3" />
            </button>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="flex items-center justify-center size-8 bg-primary text-primary-foreground rounded-full">
            <User className="size-4" />
          </div>
        </div>
      )}
    </div>
  );
};
