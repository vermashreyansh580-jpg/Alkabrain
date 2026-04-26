import { Zap, Brain, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMode } from "@/lib/store";

const MODES: { id: ChatMode; label: string; Icon: typeof Zap; tip: string }[] = [
  { id: "fast", label: "Fast", Icon: Zap, tip: "Quick replies, small fast model" },
  { id: "planning", label: "Planning", Icon: Brain, tip: "Step-by-step reasoning" },
  { id: "pro", label: "Pro", Icon: Crown, tip: "Deep, thorough answers (flagship)" },
];

export function ModeSelector({
  value,
  onChange,
}: {
  value: ChatMode;
  onChange: (m: ChatMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-muted/50 border border-border/50">
      {MODES.map(({ id, label, Icon, tip }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            title={tip}
            onClick={() => onChange(id)}
            className={cn(
              "h-7 px-2.5 rounded-full flex items-center gap-1 text-[11px] font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60",
            )}
          >
            <Icon className="w-3 h-3" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
