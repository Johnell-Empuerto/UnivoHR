import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AiChatDrawer } from "./AiChatDrawer";
import { Bot } from "lucide-react";

export const AiChatButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg shadow-primary/20"
        size="icon"
      >
        <Bot className="size-5" />
      </Button>
      <AiChatDrawer open={open} onOpenChange={setOpen} />
    </>
  );
};
