export interface AiSession {
  id: number;
  user_id: number;
  title: string;
  status: "ACTIVE" | "ARCHIVED" | "DELETED";
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface AiMessage {
  id: number;
  session_id: number;
  user_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  intent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AiSuggestion {
  label?: string;
  question?: string;
}

export interface AiChatData {
  sessionId: number;
  messageId: number;
  intent: string;
  answer: string;
  suggestions: string[];
  entities?: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface AiChatResponse {
  success: boolean;
  data: AiChatData;
}

export interface AiFeedbackPayload {
  messageId: number;
  rating: number;
  comment?: string;
}
