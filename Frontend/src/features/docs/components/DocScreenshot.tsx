import { useState } from "react";
import { ImageIcon } from "lucide-react";

type DocScreenshotProps = {
  src: string;
  alt: string;
};

const DocScreenshot = ({ src, alt }: DocScreenshotProps) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 p-6 text-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Screenshot unavailable
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Add image at <code className="text-xs">{src}</code>
        </p>
      </div>
    );
  }

  return (
    <figure className="rounded-lg border border-border/50 overflow-hidden bg-muted/20 shadow-sm">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto block"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
      <figcaption className="sr-only">{alt}</figcaption>
    </figure>
  );
};

export default DocScreenshot;
