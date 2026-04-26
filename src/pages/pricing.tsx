import { useAuth } from "@/hooks/useFirebaseAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const HF_BACKEND = "https://shrey77777-alkabrain.hf.space";

type Tier = {
  id: string;
  name: string;
  priceLabel: string;
  features: string[];
  paymentLink?: string;
};

export function Pricing() {
  const { isAuthenticated, login } = useAuth();

  const { data } = useQuery<{ tiers: Tier[] }>({
    queryKey: ["billing-tiers"],
    queryFn: async () => {
      const r = await fetch(`${HF_BACKEND}/api/billing/tiers`);
      if (!r.ok) throw new Error("Failed to fetch tiers");
      return r.json();
    },
  });

  const { data: me } = useQuery<{ tier?: { id: string } }>({
    queryKey: ["my-billing"],
    queryFn: async () => {
      const r = await fetch(`${HF_BACKEND}/api/billing/me`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch billing");
      return r.json();
    },
    enabled: isAuthenticated,
  });

  const currentTier = me?.tier?.id ?? "free";

  return (
    <div className="flex-1 overflow-auto bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">
            Pick a plan that fits you
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            ALKABRAIN talks like a friend and thinks deeply for you. Start free, upgrade when you need more.
          </p>
          {!isAuthenticated && (
            <div className="pt-2">
              <Button onClick={login} size="lg" className="gap-2">
                Sign in to get started
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(data?.tiers ?? []).map((tier) => {
            const isCurrent = currentTier === tier.id;
            const isPaid = tier.id !== "free";
            return (
              <Card
                key={tier.id}
                className={cn(
                  "flex flex-col border-border/60 bg-card relative overflow-hidden",
                  tier.id === "starter" && "border-primary/50 shadow-lg shadow-primary/5",
                  tier.id === "pro" && "border-amber-500/40"
                )}
              >
                {tier.id === "starter" && (
                  <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-widest text-center py-1">
                    Most popular
                  </div>
                )}
                <CardHeader className={cn("pb-4", tier.id === "starter" && "pt-8")}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-serif flex items-center gap-2">
                      {tier.id === "pro" && <Crown className="w-5 h-5 text-amber-500" />}
                      {tier.id === "starter" && <Sparkles className="w-5 h-5 text-primary" />}
                      {tier.name}
                    </CardTitle>
                    {isCurrent && <Badge variant="secondary">Current</Badge>}
                  </div>
                  <CardDescription className="text-base mt-1">
                    {tier.priceLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-6">
                  <ul className="space-y-3 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/85">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isPaid ? (
                    isAuthenticated ? (
                      <Button
                        asChild
                        className={cn(
                          "w-full gap-2",
                          tier.id === "pro" && "bg-amber-500 hover:bg-amber-600 text-white"
                        )}
                        disabled={isCurrent}
                      >
                        <a
                          href={tier.paymentLink ?? "#"}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {isCurrent ? "Active" : `Upgrade to ${tier.name}`}
                          {!isCurrent && <ExternalLink className="w-4 h-4" />}
                        </a>
                      </Button>
                    ) : (
                      <Button onClick={login} className="w-full">
                        Sign in to upgrade
                      </Button>
                    )
                  ) : (
                    <Button variant="secondary" className="w-full" disabled>
                      {isCurrent ? "You're here" : "Free forever"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="rounded-lg border border-border/60 bg-card/40 p-6 text-sm text-muted-foreground space-y-2 max-w-3xl mx-auto">
          <p className="font-medium text-foreground">How billing works</p>
          <p>
            Payments are processed securely by Razorpay. After your payment is captured, your account is upgraded automatically — usually within a few seconds.
          </p>
          <p>
            Need help? Tell ALKABRAIN about it on the chat page — your friendly AI is happy to walk you through it.
          </p>
        </div>
      </div>
    </div>
  );
}
