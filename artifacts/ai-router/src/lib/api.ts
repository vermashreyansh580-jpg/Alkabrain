// Lightweight fetch helpers for endpoints not covered by codegen.
import { apiUrl } from "./api-base";

async function http<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers: HeadersInit = { ...(init?.headers ?? {}) };
  let body = init?.body;
  if (init?.json !== undefined) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  const res = await fetch(apiUrl(`/api${path}`), {
    credentials: "include",
    ...init,
    headers,
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export type Conversation = {
  id: number;
  userId: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
};

export type ConversationMessage = {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export const conversationsApi = {
  list: () =>
    http<{ conversations: Conversation[] }>("/conversations"),
  load: (id: number) =>
    http<{ conversation: Conversation; messages: ConversationMessage[] }>(
      `/conversations/${id}/messages`,
    ),
  rename: (id: number, title: string) =>
    http<{ conversation: Conversation }>(`/conversations/${id}`, {
      method: "PATCH",
      json: { title },
    }),
  remove: (id: number) =>
    http<{ ok: true }>(`/conversations/${id}`, { method: "DELETE" }),
};

export const helpApi = {
  chat: (messages: { role: "user" | "assistant"; content: string }[]) =>
    http<{ reply: string }>("/help/chat", { method: "POST", json: { messages } }),
};
