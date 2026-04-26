import React, { useRef, useEffect } from "react";
import { ArrowUp, Image as ImageIcon, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeSelector } from "./mode-selector";
import type { ChatMode } from "@/lib/store";

interface ComposerProps {
  onSend: (text: string, kind: "chat" | "image" | "video") => void;
  disabled?: boolean;
  mode: ChatMode;
  onModeChange: (m: ChatMode) => void;
}

export function Composer({ onSend, disabled, mode, onModeChange }: ComposerProps) {
  const [input, setInput] = React.useState("");
  const [kind, setKind] = React.useState<"chat" | "image" | "video">("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const submit = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim(), kind);
      setInput("");
      setKind("chat");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = input.trim().length > 0 && !disabled;

  const placeholder =
    kind === "image"
      ? "Describe the image you want…"
      : kind === "video"
        ? "Describe the video you want… (slow, 60–120s)"
        : "Ask ALKABRAIN anything…";

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div
        className={cn(
          "relative bg-card rounded-3xl border border-border/60 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition-all",
          "focus-within:border-primary/40 focus-within:shadow-[0_8px_30px_-8px_rgba(234,88,12,0.18)]",
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full resize-none bg-transparent outline-none px-5 pt-4 pb-2 max-h-[240px] text-foreground placeholder:text-muted-foreground/70 text-[15px] leading-relaxed"
          disabled={disabled}
        />
        <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-1 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <ModeSelector value={mode} onChange={onModeChange} />
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Generate an image"
                onClick={() => setKind(kind === "image" ? "chat" : "image")}
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center transition-all",
                  kind === "image"
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Generate a video"
                onClick={() => setKind(kind === "video" ? "chat" : "video")}
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center transition-all",
                  kind === "video"
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <Film className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <button
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 shrink-0",
              canSend
                ? "bg-primary text-primary-foreground hover:scale-105 shadow-md shadow-primary/30"
                : "bg-muted text-muted-foreground/50",
            )}
          >
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <p className="text-[10.5px] text-center text-muted-foreground/60 mt-2">
        ALKABRAIN can occasionally make mistakes. Double-check important info.
      </p>
    </div>
  );
}
