import { Loader2 } from "lucide-react";

interface LoaderProps {
  message?: string;
  fullPage?: boolean;
}

const Loader = ({ message, fullPage }: LoaderProps) => {
  const content = (
    <div className="flex items-center justify-center gap-2 py-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-[50vh]">{content}</div>
    );
  }

  return content;
};

export default Loader;
