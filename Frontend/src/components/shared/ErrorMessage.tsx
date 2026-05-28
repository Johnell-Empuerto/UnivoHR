import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorMessageProps {
  message?: string;
  title?: string;
}

const ErrorMessage = ({ message, title }: ErrorMessageProps) => {
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title || "Error"}</AlertTitle>
        <AlertDescription>
          {message || "An unexpected error occurred. Please try again."}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ErrorMessage;
