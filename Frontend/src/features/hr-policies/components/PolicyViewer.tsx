import { Badge } from "@/components/ui/badge";

interface PolicyViewerProps {
  title: string;
  category: string;
  content: string;
  updatedAt?: string;
}

const isHtml = (content: string) => /<[a-z][\s\S]*>/i.test(content);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const categoryColors: Record<string, string> = {
  attendance: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  leave: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  overtime: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  security: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  payroll: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  privacy: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
};

export const PolicyViewer = ({
  title,
  category,
  content,
  updatedAt,
}: PolicyViewerProps) => {
  const isRich = isHtml(content);

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className={
                categoryColors[category] ||
                "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
              }
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
            <h2 className="text-xl font-semibold leading-tight">{title}</h2>
          </div>
          {updatedAt && (
            <p className="text-xs text-muted-foreground whitespace-nowrap pt-1">
              Last updated: {formatDate(updatedAt)}
            </p>
          )}
        </div>
      </div>

      <div className="p-6">
        {isRich ? (
          <div
            className="policy-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="policy-content">
            {content.split("\n").map((line, i) => (
              <p key={i} className="mb-2">
                {line || "\u00A0"}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
