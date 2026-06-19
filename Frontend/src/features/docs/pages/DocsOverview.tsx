import { PHASES, getGuidesByPhase } from "../data/docsData";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

const phaseIcons: Record<number, string> = {
  1: "🚀",
  2: "⚙️",
  3: "📡",
  4: "👥",
  5: "📋",
  6: "🎯",
  7: "💰",
  8: "👤",
  9: "🔒",
  10: "📦",
};

const DocsOverview = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          Select a phase below to explore its guides, or use the sidebar to jump
          to a specific topic.
        </p>
      </div>

      {PHASES.map((phase) => {
        const guides = getGuidesByPhase(phase.number);
        return (
          <section key={phase.number} id={`phase-${phase.number}`} className="scroll-mt-24">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="text-2xl">{phaseIcons[phase.number]}</span>
                  <span>
                    Phase {phase.number}: {phase.name}
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {guides.length} guide{guides.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
                {phase.number === 10 && (
                  <CardDescription className="text-sm">
                    These guides cover server deployment and maintenance. Write
                    these last, after all other guides are complete.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {guides.map((guide) => (
                    <button
                      key={guide.id}
                      type="button"
                      onClick={() => navigate(guide.path)}
                      className="w-full text-left p-3 rounded-lg border border-border/40 hover:bg-muted/60 hover:border-border transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-foreground">
                            {guide.order}. {guide.title}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {guide.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={
                              guide.status === "Published"
                                ? "default"
                                : guide.status === "Draft"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {guide.status === "Not Started"
                              ? "Planned"
                              : guide.status}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            {phase.number < PHASES.length && (
              <Separator className="my-6" />
            )}
          </section>
        );
      })}
    </div>
  );
};

export default DocsOverview;
