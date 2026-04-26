import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";

const HF_BACKEND = "https://shrey77777-alkabrain.hf.space";

type Model = {
  id: string;
  label: string;
  provider: string;
  description: string;
  intents: string[];
  contextWindow?: number;
};

export function Models() {
  const { data, isLoading } = useQuery<{ models: Model[] }>({
    queryKey: ["models"],
    queryFn: async () => {
      const r = await fetch(`${HF_BACKEND}/api/models`);
      if (!r.ok) throw new Error("Failed to fetch models");
      return r.json();
    },
  });

  return (
    <div className="flex-1 overflow-auto bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight font-serif mb-2">Available Models</h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            The router evaluates your prompt and directs it to the optimal specialist model.
            These are the models currently registered in the pool.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse border-muted bg-muted/20">
                <CardHeader className="h-24"></CardHeader>
                <CardContent className="h-20"></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data?.models ?? []).map((model) => (
              <Card key={model.id} className="border-border/60 hover:border-border transition-colors flex flex-col bg-card/50">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15 border-none font-medium">
                      {model.provider}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-serif">{model.label}</CardTitle>
                  <CardDescription className="text-xs font-mono mt-1 opacity-70 break-all">{model.id}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-6 flex-1">
                    {model.description}
                  </p>
                  <div className="space-y-3 mt-auto">
                    <div className="flex flex-wrap gap-1.5">
                      {model.intents.map(intent => (
                        <Badge key={intent} variant="outline" className="text-xs bg-background/50 border-border">
                          {intent}
                        </Badge>
                      ))}
                    </div>
                    {model.contextWindow && (
                      <div className="flex items-center text-xs text-muted-foreground pt-2 border-t border-border/50">
                        <Layers className="w-3.5 h-3.5 mr-1.5" />
                        {Math.round(model.contextWindow / 1000)}k context
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
