import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, Code2, FileText, Blocks, TerminalSquare } from "lucide-react";
import type { ArtifactPayload } from "@/lib/store";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArtifactViewerProps {
  artifact: ArtifactPayload | null;
}

export function ArtifactViewer({ artifact }: ArtifactViewerProps) {
  if (!artifact) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center mb-4">
          <Blocks className="w-8 h-8 opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2 font-serif">Workspace Empty</h3>
        <p className="max-w-xs text-sm">
          Artifacts will appear here when the AI generates code, documents, or diagrams.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    let ext = ".txt";
    if (artifact.kind === "code") ext = artifact.language ? `.${artifact.language}` : ".txt";
    if (artifact.kind === "markdown") ext = ".md";
    if (artifact.kind === "html") ext = ".html";
    if (artifact.kind === "mermaid") ext = ".mmd";
    
    a.download = (artifact.title || "artifact").toLowerCase().replace(/\s+/g, "-") + ext;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getIcon = () => {
    switch (artifact.kind) {
      case "code": return <Code2 className="w-4 h-4 text-primary" />;
      case "markdown": return <FileText className="w-4 h-4 text-primary" />;
      case "html": return <TerminalSquare className="w-4 h-4 text-primary" />;
      default: return <Blocks className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
            {getIcon()}
          </div>
          <div className="truncate font-medium text-sm">
            {artifact.title || `Generated ${artifact.kind}`}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-card/30">
        {artifact.kind === "markdown" ? (
          <div className="p-6 prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="p-4 h-full">
            <div className="rounded-lg overflow-hidden border border-border/50 h-full shadow-sm">
              <SyntaxHighlighter
                language={artifact.language || "text"}
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1.5rem', height: '100%', background: 'hsl(var(--sidebar))' }}
                showLineNumbers={artifact.kind === 'code'}
              >
                {artifact.content}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
