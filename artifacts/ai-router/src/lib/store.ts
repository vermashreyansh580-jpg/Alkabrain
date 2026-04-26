import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ChatResponse,
  ArtifactPayload,
} from "@workspace/api-client-react";

export type MessageMedia = {
  kind: "image" | "video";
  dataUrl: string;
  prompt?: string;
};

export type ChatMode = "fast" | "planning" | "pro";

export type MessageWithResponse = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: ChatResponse;
  media?: MessageMedia;
};

interface ChatState {
  messages: MessageWithResponse[];
  activeArtifact: ArtifactPayload | null;
  activeConversationId: number | null;
  addMessage: (msg: Omit<MessageWithResponse, "id">) => void;
  setResponse: (id: string, response: ChatResponse) => void;
  setActiveArtifact: (artifact: ArtifactPayload | null) => void;
  setActiveConversation: (id: number | null) => void;
  loadConversation: (
    id: number,
    messages: { role: string; content: string }[],
  ) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      activeArtifact: null,
      activeConversationId: null,
      addMessage: (msg) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { ...msg, id: Date.now().toString() + Math.random() },
          ],
        })),
      setResponse: (id, response) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, response } : m,
          ),
          activeArtifact: response.artifact
            ? response.artifact
            : state.activeArtifact,
          activeConversationId:
            response.conversationId ?? state.activeConversationId,
        })),
      setActiveArtifact: (artifact) => set({ activeArtifact: artifact }),
      setActiveConversation: (id) => set({ activeConversationId: id }),
      loadConversation: (id, msgs) =>
        set({
          activeConversationId: id,
          activeArtifact: null,
          messages: msgs.map((m, i) => ({
            id: `${id}-${i}`,
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      clearChat: () =>
        set({
          messages: [],
          activeArtifact: null,
          activeConversationId: null,
        }),
    }),
    { name: "ai-router-chat" },
  ),
);
