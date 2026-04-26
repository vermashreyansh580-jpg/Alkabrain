// Lightweight fetch helpers for endpoints not covered by codegen.
import { apiUrl } from "./api-base";

function readStoredSid(): string | null {
  try {
    return globalThis.localStorage?.getItem("alkabrain.sid") ?? null;
  } catch {
    return null;
  }
}

async function http<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  let body = init?.body;
  if (init?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  const sid = readStoredSid();
  if (sid && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${sid}`;
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
