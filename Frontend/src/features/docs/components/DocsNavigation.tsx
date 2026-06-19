import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getGuideByPath, docsData } from "../data/docsData";

type DocsNavigationProps = {
  currentPath: string;
};

const DocsNavigation = ({ currentPath }: DocsNavigationProps) => {
  const navigate = useNavigate();
  const currentGuide = getGuideByPath(currentPath);
  if (!currentGuide) return null;

  const prevGuide = currentGuide.previousGuideId
    ? docsData.find((g) => g.id === currentGuide.previousGuideId)
    : undefined;
  const nextGuide = currentGuide.nextGuideId
    ? docsData.find((g) => g.id === currentGuide.nextGuideId)
    : undefined;

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        {prevGuide && (
          <Button variant="outline" onClick={() => navigate(prevGuide.path)}>
            ← {prevGuide.title}
          </Button>
        )}
      </div>
      <div>
        {nextGuide && (
          <Button onClick={() => navigate(nextGuide.path)}>
            {nextGuide.title} →
          </Button>
        )}
      </div>
    </div>
  );
};

export default DocsNavigation;
