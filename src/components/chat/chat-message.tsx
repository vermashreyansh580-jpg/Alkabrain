import React from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageWithResponse } from "@/lib/store";

interface ChatMessageProps {
  message: MessageWithResponse;
}

export function ChatMessageBubble({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "py-6 px-4 md:px-8 flex gap-4 md:gap-6 group",
        isUser ? "" : "bg-card/50",
      )}
    >
      <div className="shrink-0 pt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div
          className={cn(
            "prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed",
            !isUser && "font-serif text-[1.05rem]",
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>

        {!isUser && message.media && (
          <div className="mt-3 rounded-xl overflow-hidden border border-border/50 bg-muted/30 max-w-md">
            {message.media.kind === "image" ? (
              <img
                src={message.media.dataUrl}
                alt={message.media.prompt ?? "Generated image"}
                className="w-full h-auto block"
              />
            ) : (
              <video
                src={message.media.dataUrl}
                controls
                playsInline
                className="w-full h-auto block bg-black"
              />
            )}
            {message.media.prompt && (
              <div className="px-3 py-2 text-xs text-muted-foreground italic border-t border-border/40">
                {message.media.prompt}
              </div>
            )}
          </div>
        )}

        {!isUser && message.response?.artifact && (
          <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/50 text-sm text-muted-foreground max-w-sm cursor-default hover:bg-muted/50 transition-colors">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="truncate">
                {message.response.artifact.title ||
                  message.response.artifact.kind}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
