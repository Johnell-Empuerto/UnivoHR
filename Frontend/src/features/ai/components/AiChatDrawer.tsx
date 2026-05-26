import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AiMessageBubble } from "./AiMessageBubble";
import { AiSuggestedQuestions } from "./AiSuggestedQuestions";
import { sendAiMessage, deleteAiSession, sendAiFeedback } from "@/services/aiService";
import type { AiMessage, AiChatData } from "../types/ai.types";
import { Send, Bot, Sparkles } from "lucide-react";

interface AiChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AiChatDrawer = ({ open, onOpenChange }: AiChatDrawerProps) => {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstOpen = useRef(true);

  useEffect(() => {
    if (open && isFirstOpen.current) {
      isFirstOpen.current = false;
      setMessages([]);
      setSessionId(null);
      setSuggestions([]);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  const handleSend = async (question?: string) => {
    const q = (question || input).trim();
    if (!q || loading) return;

    const userMessage: AiMessage = {
      id: Date.now(),
      session_id: sessionId || 0,
      user_id: 0,
      role: "user",
      content: q,
      intent: null,
      metadata: {},
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendAiMessage(q, sessionId || undefined);
      const data: AiChatData = response.data;

      const assistantMessage: AiMessage = {
        id: data.messageId,
        session_id: data.sessionId,
        user_id: 0,
        role: "assistant",
        content: data.answer,
        intent: data.intent,
        metadata: { ...data.metadata, ...(data.entities ? { employeeName: data.entities.employeeName, branchName: data.entities.branchName, department: data.entities.department } : {}) },
        created_at: new Date().toISOString(),
      };

      setSessionId(data.sessionId);
      setMessages((prev) => [...prev, assistantMessage]);
      setSuggestions(data.suggestions || []);
    } catch {
      const errorMessage: AiMessage = {
        id: Date.now() + 1,
        session_id: sessionId || 0,
        user_id: 0,
        role: "assistant",
        content: "Sorry, I couldn't process that request.",
        intent: null,
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedClick = (question: string) => {
    setInput(question);
    setTimeout(() => handleSend(question), 50);
  };

  const handleFeedback = async (messageId: number, rating: number) => {
    try {
      await sendAiFeedback(messageId, rating);
    } catch {
      // silently fail
    }
  };

  const handleNewChat = () => {
    if (sessionId) {
      deleteAiSession(sessionId).catch(() => {});
    }
    setMessages([]);
    setSessionId(null);
    setSuggestions([]);
    isFirstOpen.current = true;
  };

  const showWelcome = messages.length === 0 && !loading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col h-dvh max-h-dvh overflow-hidden"
      >
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-7 bg-primary/10 text-primary rounded-full">
                <Bot className="size-4" />
              </div>
              <SheetTitle className="text-sm">AI Assistant</SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={handleNewChat} title="New chat">
                <Sparkles className="size-3.5" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            {showWelcome ? (
              <div className="min-h-full flex flex-col items-center justify-center text-center gap-3 px-4 py-12">
                <div className="flex items-center justify-center size-12 bg-primary/10 text-primary rounded-full">
                  <Bot className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Hi, I&apos;m your HR AI Assistant. I can help with attendance, payroll, anomalies, and forecasts.
                </p>
                <div className="pt-2 w-full">
                  <AiSuggestedQuestions onSelect={handleSuggestedClick} />
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 space-y-3 pb-4">
                {messages.map((msg) => (
                  <AiMessageBubble key={msg.id} message={msg} onFeedback={handleFeedback} />
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center size-8 bg-primary/10 text-primary rounded-full shrink-0">
                      <Bot className="size-4" />
                    </div>
                    <div className="space-y-2 flex-1 max-w-[85%]">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-16 w-full rounded-2xl" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>

        {messages.length > 0 && suggestions.length > 0 && !loading && (
          <div className="shrink-0 border-t bg-muted/30 px-4 py-2">
            <AiSuggestedQuestions onSelect={handleSuggestedClick} questions={suggestions} />
          </div>
        )}

        <div className="shrink-0 border-t px-4 py-3 bg-background">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about HR data..."
              className="flex-1 h-9 text-sm"
              disabled={loading}
            />
            <Button
              size="icon-sm"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
            >
              <Send className="size-3.5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
