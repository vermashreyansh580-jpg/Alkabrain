import React, { useEffect, useRef } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Composer } from "@/components/chat/composer";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { ArtifactViewer } from "@/components/chat/artifact-viewer";
import { useChatStore, type ChatMode } from "@/lib/store";
import { useSendChat, getGetMyBillingQueryOptions } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, LogIn, AlertTriangle, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import logoUrl from "@/assets/alkabrain-logo.png";

const SUGGESTIONS = [
  "Write a Python function to fetch weather data",
  "Explain quantum entanglement like I'm 10",
  "Draw a system diagram for a chat app in mermaid",
  "Give me a 7-day plan to learn React",
];

export function Home() {
  const { messages, activeArtifact, addMessage, setResponse } = useChatStore();
  const sendChat = useSendChat();
  const queryClient = useQueryClient();
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = React.useState(true);
  const [mode, setMode] = React.useState<ChatMode>("fast");
  const [mediaPending, setMediaPending] = React.useState<null | "image" | "video">(null);
  const [rateLimit, setRateLimit] = React.useState<null | {
    message: string;
    resetAt: string;
  }>(null);

  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { data: billing } = useQuery({
    ...getGetMyBillingQueryOptions(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, sendChat.isPending]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom =
      Math.abs(target.scrollHeight - target.clientHeight - target.scrollTop) < 50;
    setIsAutoScroll(isAtBottom);
  };

  const generateMedia = async (
    prompt: string,
    kind: "image" | "video",
  ): Promise<void> => {
    setMediaPending(kind);
    try {
      const { apiUrl } = await import("@/lib/api-base");
      let sid: string | null = null;
      try {
        sid = globalThis.localStorage?.getItem("alkabrain.sid") ?? null;
      } catch {
        sid = null;
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (sid) headers.Authorization = `Bearer ${sid}`;
      const r = await fetch(apiUrl(`/api/${kind}/generate`), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ prompt }),
      });
      if (r.status === 401) {
        login();
        return;
      }
      const data = await r.json();
      if (!r.ok) {
        if (r.status === 429 && data?.resetAt) {
          setRateLimit({
            message: data.error ?? "Daily limit reached.",
            resetAt: data.resetAt,
          });
        }
        addMessage({
          role: "assistant",
          content: data?.error ?? `Failed to generate ${kind}.`,
        });
        return;
      }
      addMessage({
        role: "assistant",
        content:
          kind === "image"
            ? `Here's your generated image:`
            : `Here's your generated video:`,
        media: { kind, dataUrl: data.dataUrl, prompt },
      });
      setIsAutoScroll(true);
      queryClient.invalidateQueries({
        queryKey: getGetMyBillingQueryOptions().queryKey,
      });
    } catch (e) {
      console.error(e);
      addMessage({
        role: "assistant",
        content: `Sorry, ${kind} generation failed. Try again in a moment.`,
      });
    } finally {
      setMediaPending(null);
    }
  };

  const handleSend = async (
    content: string,
    kind: "chat" | "image" | "video" = "chat",
  ) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setRateLimit(null);
    const tempId = Date.now().toString();
    addMessage({ role: "user", content, id: tempId });

    if (kind === "image" || kind === "video") {
      await generateMedia(content, kind);
      return;
    }

    try {
      const apiMessages = messages
        .map((m) => ({ role: m.role, content: m.content }))
        .concat([{ role: "user", content }]);
      const res = await sendChat.mutateAsync({
        data: {
          messages: apiMessages,
          conversationId: activeConversationId ?? undefined,
          mode,
        } as any,
      });
      const responseId = Date.now().toString();
      addMessage({ role: "assistant", content: res.reply, id: responseId });
      setResponse(responseId, res);
      setIsAutoScroll(true);
      queryClient.invalidateQueries({
        queryKey: getGetMyBillingQueryOptions().queryKey,
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      const data = error?.data ?? error?.response?.data;
      if (status === 429 && data?.resetAt) {
        setRateLimit({
          message: data.error ?? "Daily limit reached.",
          resetAt: data.resetAt,
        });
      } else if (status === 401) {
        login();
      } else {
        console.error(error);
      }
    }
  };

  const persona = (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <img src={logoUrl} alt="ALKABRAIN" className="w-20 h-20 rounded-2xl mb-6 shadow-md" />
      <h2 className="text-3xl md:text-4xl font-serif font-medium mb-3 text-foreground">
        Hey, I'm ALKABRAIN.
      </h2>
      <p className="text-muted-foreground mb-10 max-w-lg">
        Your friendly AI companion for code, ideas, writing, and everything in between. Just ask.
      </p>
      {isAuthenticated ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
          {SUGGESTIONS.map((s) => (
            <Card
              key={s}
              className="p-4 text-left hover:bg-muted/50 cursor-pointer transition-colors border-border/60 hover:border-border"
              onClick={() => handleSend(s)}
            >
              <p className="text-sm text-foreground/80 font-medium">{s}</p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <Button onClick={login} size="lg" className="gap-2">
            <LogIn className="w-4 h-4" /> Sign in to start chatting
          </Button>
          <p className="text-xs text-muted-foreground">
            Free plan gets 30 messages a day. No card required.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full items-stretch flex-1 min-h-0">
      <ResizablePanel defaultSize={60} minSize={30} className="flex flex-col min-h-0 bg-background relative">
        {/* Status Strip */}
        <div className="absolute top-0 inset-x-0 h-8 bg-card/80 backdrop-blur border-b z-10 flex items-center justify-center text-[11px] font-mono text-muted-foreground gap-2 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
          <span>ALKABRAIN · online</span>
          {billing?.tier?.id === "pro" && (
            <span className="flex items-center gap-1 text-amber-500">
              <Crown className="w-3 h-3" /> Pro
            </span>
          )}
        </div>

        {/* Chat Area */}
        <div
          className="flex-1 overflow-y-auto pt-8 pb-32"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {authLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            persona
          ) : (
            <div className="flex flex-col">
              {messages.map((m) => (
                <ChatMessageBubble key={m.id} message={m} />
              ))}
              {(sendChat.isPending || mediaPending) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-6 px-4 md:px-8 flex gap-6 bg-card/50"
                >
                  <div className="w-8 h-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground font-serif">
                    {mediaPending === "image"
                      ? "Painting your image…"
                      : mediaPending === "video"
                        ? "Rendering your video (this can take a minute)…"
                        : mode === "planning"
                          ? "Planning…"
                          : mode === "pro"
                            ? "Thinking deeply…"
                            : "Thinking…"}
                  </div>
                </motion.div>
              )}
              {rateLimit && (
                <div className="mx-4 md:mx-8 my-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rateLimit.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Resets at {new Date(rateLimit.resetAt).toLocaleString()}
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2 hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Upgrade for more
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-10">
          <Composer
            onSend={handleSend}
            disabled={sendChat.isPending || authLoading || !!mediaPending}
            mode={mode}
            onModeChange={setMode}
          />
        </div>
      </ResizablePanel>

      <AnimatePresence>
        {(activeArtifact || window.innerWidth > 768) && (
          <>
            <ResizableHandle withHandle className="bg-border/60" />
            <ResizablePanel
              defaultSize={40}
              minSize={25}
              className="hidden md:flex flex-col min-h-0 bg-sidebar border-l border-border shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)]"
            >
              <ArtifactViewer artifact={activeArtifact} />
            </ResizablePanel>
          </>
        )}
      </AnimatePresence>
    </ResizablePanelGroup>
  );
}
