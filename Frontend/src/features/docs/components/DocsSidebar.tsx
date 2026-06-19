import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { PHASES, getGuidesByPhase, getGuideByPath } from "../data/docsData";
import { useAuth } from "@/app/providers/AuthProvider";

type DocsSidebarProps = {
  activePath: string;
  onNavigate: (path: string) => void;
  className?: string;
};

const DocsSidebar = ({
  activePath,
  onNavigate,
  className,
}: DocsSidebarProps) => {
  const activeGuide = getGuideByPath(activePath);
  const activePhase = activeGuide?.phase ?? 1;
  const { hasPermission } = useAuth();
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(
    () => new Set([activePhase]),
  );

  const togglePhase = (phase: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  return (
    <nav
      className={cn("flex flex-col gap-4 text-sm", className)}
      aria-label="Documentation table of contents"
    >
      <div className="flex items-center gap-2 px-1 text-foreground font-semibold">
        <BookOpen className="h-4 w-4 text-primary" />
        <span>Contents</span>
      </div>
      {PHASES.map((phase) => {
        const guides = getGuidesByPhase(phase.number).filter(
          (g) => !g.requiredPermission || hasPermission(g.requiredPermission),
        );
        const isExpanded = expandedPhases.has(phase.number);
        return (
          <div key={phase.number}>
            <button
              type="button"
              onClick={() => togglePhase(phase.number)}
              className={cn(
                "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors",
                activePhase === phase.number
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <span>
                Phase {phase.number}: {phase.name}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 shrink-0" />
              )}
            </button>
            {isExpanded && (
              <ul className="space-y-0.5 mt-1 ml-1">
                {guides.map((guide) => {
                  const isActive = activePath === guide.path;
                  return (
                    <li key={guide.id}>
                      <button
                        type="button"
                        onClick={() => onNavigate(guide.path)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 rounded-lg transition-colors text-xs",
                          isActive
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      >
                        {guide.order}. {guide.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default DocsSidebar;
