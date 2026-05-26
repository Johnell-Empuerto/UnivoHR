import { cn } from "@/lib/utils";

const DEFAULT_QUESTIONS = [
  "Show dashboard summary",
  "Show attendance summary today",
  "Show payroll summary",
  "Show anomaly summary",
  "Show forecast summary",
  "Who is late today?",
];

interface AiSuggestedQuestionsProps {
  onSelect: (question: string) => void;
  questions?: string[];
}

export const AiSuggestedQuestions = ({ onSelect, questions }: AiSuggestedQuestionsProps) => {
  const items = questions || DEFAULT_QUESTIONS;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className={cn(
            "text-xs px-2.5 py-1.5 rounded-full border transition-colors",
            "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
          )}
        >
          {q}
        </button>
      ))}
    </div>
  );
};
