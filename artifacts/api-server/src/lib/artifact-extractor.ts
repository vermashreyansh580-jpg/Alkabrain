export type ArtifactPayload = {
  kind: "code" | "markdown" | "html" | "mermaid";
  language?: string | null;
  title?: string | null;
  content: string;
};

const FENCE_RE = /```(\w+)?\n([\s\S]*?)```/g;

export function extractArtifact(reply: string): ArtifactPayload | null {
  const blocks: { lang: string; body: string }[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(FENCE_RE);
  while ((m = re.exec(reply)) !== null) {
    blocks.push({ lang: (m[1] ?? "").toLowerCase(), body: m[2] });
  }
  if (blocks.length === 0) return null;

  // pick the longest block
  blocks.sort((a, b) => b.body.length - a.body.length);
  const best = blocks[0];

  if (best.body.length < 30) return null;

  if (best.lang === "mermaid") {
    return { kind: "mermaid", title: "Diagram", content: best.body };
  }
  if (best.lang === "html") {
    return { kind: "html", title: "HTML", content: best.body };
  }
  if (best.lang === "md" || best.lang === "markdown") {
    return { kind: "markdown", title: "Document", content: best.body };
  }
  if (best.lang) {
    return {
      kind: "code",
      language: best.lang,
      title: `${best.lang} snippet`,
      content: best.body,
    };
  }
  return {
    kind: "code",
    language: "text",
    title: "Snippet",
    content: best.body,
  };
}
