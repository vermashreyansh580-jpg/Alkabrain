import React from "react";
import { Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Deploy() {
  return (
    <div className="flex-1 overflow-auto bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight font-serif mb-2">Deployment</h1>
          <p className="text-muted-foreground text-lg">
            This app is deployed via GitHub Pages. The backend runs on Hugging Face Spaces.
          </p>
        </div>
        <Card className="border-border/60 bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Deployment Info
            </CardTitle>
            <CardDescription>
              Frontend: GitHub Pages &nbsp;|&nbsp; Backend: HuggingFace Space (shrey77777/Alkabrain)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The frontend is hosted on GitHub Pages at <span className="font-mono">vermashreyansh580-jpg.github.io/alkabrain</span>. 
              All AI requests are forwarded to the Hugging Face backend at <span className="font-mono">shrey77777-alkabrain.hf.space</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
