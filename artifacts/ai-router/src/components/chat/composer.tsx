import React, { useRef, useEffect, useCallback } from "react";
import { ArrowUp, Image as ImageIcon, Film, Paperclip, FolderOpen, X, FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeSelector } from "./mode-selector";
import type { ChatMode } from "@/lib/store";
import type { Attachment } from "@/lib/store";

export type { Attachment };

export interface FsFileInfo {
  name: string;
  handle: FileSystemFileHandle;
  content: string;
}

interface ComposerProps {
  onSend: (text: string, kind: "chat" | "image" | "video", attachments: Attachment[]) => void;
  disabled?: boolean;
  mode: ChatMode;
  onModeChange: (m: ChatMode) => void;
  fsFile?: FsFileInfo | null;
  onFsFile?: (f: FsFileInfo | null) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function Composer({ onSend, disabled, mode, onModeChange, fsFile, onFsFile }: ComposerProps) {
  const [input, setInput] = React.useState("");
  const [kind, setKind] = React.useState<"chat" | "image" | "video">("chat");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
    }
  };

  useEffect(() => { adjustHeight(); }, [input]);

  const processFile = useCallback(async (file: File): Promise<Attachment> => {
    const isImage = file.type.startsWith("image/");
    const isText =
      file.type.startsWith("text/") ||
      /\.(ts|tsx|js|jsx|py|java|c|cpp|cs|go|rs|rb|php|swift|kt|md|json|yaml|yml|toml|xml|html|css|scss|sh|bash|env)$/i.test(file.name);

    if (isImage) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result as string });
        reader.readAsDataURL(file);
      });
    }
    if (isText || file.size < 200 * 1024) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve({ name: file.name, type: file.type || "text/plain", size: file.size, text: reader.result as string });
        reader.onerror = () =>
          resolve({ name: file.name, type: file.type, size: file.size });
        reader.readAsText(file);
      });
    }
    return { name: file.name, type: file.type, size: file.size };
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, 8);
    const processed = await Promise.all(arr.map(processFile));
    setAttachments((prev) => [...prev, ...processed].slice(0, 8));
  }, [processFile]);

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current++; setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); dragCounter.current = 0; setIsDragging(false);
    if (e.dataTransfer.files.length > 0) await addFiles(e.dataTransfer.files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) { await addFiles(e.target.files); e.target.value = ""; }
  };

  const handleFsPicker = async () => {
    if (!("showOpenFilePicker" in window)) {
      alert("File System Access is only supported in Chrome and Edge. Please switch to one of those browsers.");
      return;
    }
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({ multiple: false });
      const file: File = await fileHandle.getFile();
      const content = await file.text();
      onFsFile?.({ name: file.name, handle: fileHandle, content });
    } catch (e: any) {
      if (e.name !== "AbortError") console.error(e);
    }
  };

  const removeAttachment = (i: number) => setAttachments((prev) => prev.filter((_, idx) => idx !== i));

  const submit = () => {
    if ((input.trim() || attachments.length > 0 || fsFile) && !disabled) {
      onSend(input.trim(), kind, attachments);
      setInput(""); setKind("chat"); setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const canSend = (input.trim().length > 0 || attachments.length > 0 || !!fsFile) && !disabled;

  const placeholder =
    kind === "image" ? "Describe the image you want…"
    : kind === "video" ? "Describe the video you want… (slow, 60–120s)"
    : fsFile ? `Ask about ${fsFile.name} or request edits…`
    : "Ask ALKABRAIN anything…";

  return (
    <div className="max-w-3xl mx-auto w-full">
      {fsFile && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-lg px-3 py-1.5 text-xs text-primary font-medium max-w-full">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{fsFile.name}</span>
            <span className="text-primary/50 text-[10px] shrink-0">— browsed from your device</span>
            <button onClick={() => onFsFile?.(null)} className="ml-1 hover:text-destructive shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative bg-card rounded-3xl border border-border/60 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition-all",
          "focus-within:border-primary/40 focus-within:shadow-[0_8px_30px_-8px_rgba(234,88,12,0.18)]",
          isDragging && "border-primary/60 bg-primary/5 shadow-[0_8px_30px_-8px_rgba(234,88,12,0.25)]",
        )}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-primary/8 pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Paperclip className="w-8 h-8" />
              <span className="text-sm font-medium">Drop files to attach</span>
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-muted/70 border border-border/50 rounded-lg px-2 py-1 text-xs max-w-[180px]">
                {a.dataUrl ? (
                  <img src={a.dataUrl} alt={a.name} className="w-5 h-5 rounded object-cover shrink-0" />
                ) : (
                  <File className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-foreground/80">{a.name}</span>
                <span className="text-muted-foreground/50 shrink-0">{formatSize(a.size)}</span>
                <button onClick={() => removeAttachment(i)} className="ml-0.5 text-muted-foreground hover:text-destructive opacity-60 hover:opacity-100 shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

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
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} />
              <button type="button" title="Attach any file — image, PDF, code, doc…" onClick={() => fileInputRef.current?.click()}
                className="h-7 w-7 rounded-full flex items-center justify-center transition-all text-muted-foreground hover:text-foreground hover:bg-muted/60">
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button type="button" title="Browse any file from your device — AI reads & can edit it" onClick={handleFsPicker}
                className={cn("h-7 w-7 rounded-full flex items-center justify-center transition-all",
                  fsFile ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}>
                <FolderOpen className="w-3.5 h-3.5" />
              </button>
              <button type="button" title="Generate an image" onClick={() => setKind(kind === "image" ? "chat" : "image")}
                className={cn("h-7 w-7 rounded-full flex items-center justify-center transition-all",
                  kind === "image" ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}>
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
              <button type="button" title="Generate a video" onClick={() => setKind(kind === "video" ? "chat" : "video")}
                className={cn("h-7 w-7 rounded-full flex items-center justify-center transition-all",
                  kind === "video" ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}>
                <Film className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <button onClick={submit} disabled={!canSend} aria-label="Send message"
            className={cn("h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 shrink-0",
              canSend ? "bg-primary text-primary-foreground hover:scale-105 shadow-md shadow-primary/30" : "bg-muted text-muted-foreground/50")}>
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <p className="text-[10.5px] text-muted-foreground/60">
          Drag &amp; drop or attach files. Use the folder icon to let AI read &amp; edit files on your device.
        </p>
        <p className="text-[10.5px] text-muted-foreground/40">ALKABRAIN may make mistakes.</p>
      </div>
    </div>
  );
}
