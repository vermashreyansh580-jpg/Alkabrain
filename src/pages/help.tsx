import React, { useEffect, useRef, useState } from "react";
import { LifeBuoy, Mail, Loader2, Send, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { helpApi } from "@/lib/api";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUPPORT_EMAIL = "alkabrainsupport@gmail.com";

const STARTER_MSG: Msg = {
  role: "assistant",
  content:
    "Hi, I'm ALKABRAIN Support. I can help with anything about ALKABRAIN — plans, billing, daily limits, login, and how features work. What's going on?",
};

export function Help() {
  const [messages, setMessages] = useState<Msg[]>([STARTER_MSG]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const conv = next.filter((m) => m !== STARTER_MSG);
      const { reply } = await helpApi.chat(conv);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(
        "Couldn't reach support right now. You can email us instead — the button below pre-fills your conversation.",
      );
    } finally {
      setSending(false);
    }
  };

  const buildEmail = () => {
    const transcript = messages
      .map((m) => `${m.role === "user" ? "Me" : "ALKABRAIN Support"}: ${m.content}`)
      .join("\n\n");
    const subject = "ALKABRAIN — Support request";
    const body = `Hi ALKABRAIN team,\n\nI need help with the following. Below is my conversation with the support assistant for context.\n\n--- Conversation ---\n${transcript}\n\n--- My request ---\n(Please add anything else here)\n\nThanks!`;
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const reset = () => {
    setMessages([STARTER_MSG]);
    setError(null);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-medium">Help & Support</h1>
            <p className="text-xs text-muted-foreground">
              Strict ALKABRAIN-only assistant. For account issues, escalate by email.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            disabled={sending}
            className="gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </Button>
          <a href={buildEmail()}>
            <Button size="sm" className="gap-2">
              <Mail className="w-3.5 h-3.5" /> Email Support
            </Button>
          </a>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border/60",
                )}
              >
                {m.role === "user" ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pl-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ALKABRAIN Support is typing…
            </div>
          )}
          {error && (
            <div className="text-sm text-amber-600 dark:text-amber-500 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="border-t px-4 md:px-6 py-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about plans, billing, login, daily limits…"
            className="flex-1 bg-card border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            disabled={sending}
          />
          <Button
            onClick={send}
            disabled={!input.trim() || sending}
            className="gap-1.5"
          >
            <Send className="w-4 h-4" /> Send
          </Button>
        </div>
        <p className="text-[11px] text-center text-muted-foreground mt-2">
          Still stuck?{" "}
          <a
            className="text-primary hover:underline"
            href={buildEmail()}
          >
            Email {SUPPORT_EMAIL}
          </a>{" "}
          — your chat will be attached automatically.
        </p>
      </div>
    </div>
  );
}
