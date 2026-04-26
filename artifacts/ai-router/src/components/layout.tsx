import React from "react";
import { Link, useLocation } from "wouter";
import {
  MessageSquare,
  Moon,
  Sun,
  Sidebar as SidebarIcon,
  Plus,
  Sparkles,
  LogIn,
  LogOut,
  Crown,
  LifeBuoy,
  Trash2,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { getGetMyBillingQueryOptions } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatStore } from "@/lib/store";
import { conversationsApi, type Conversation } from "@/lib/api";
import logoUrl from "@/assets/alkabrain-logo.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const clearChat = useChatStore((s) => s.clearChat);
  const loadConversation = useChatStore((s) => s.loadConversation);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const { user, isLoading: authLoading, login, logout, isAuthenticated } =
    useAuth();
  const queryClient = useQueryClient();

  const { data: billing } = useQuery({
    ...getGetMyBillingQueryOptions(),
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: () => conversationsApi.list(),
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => conversationsApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (activeConversationId === id) clearChat();
    },
  });

  const handleNewChat = () => {
    clearChat();
    if (location !== "/") setLocation("/");
  };

  const openConversation = async (id: number) => {
    if (location !== "/") setLocation("/");
    try {
      const { messages } = await conversationsApi.load(id);
      loadConversation(id, messages);
    } catch {
      // ignore; user can retry
    }
  };

  const tierName = billing?.tier?.name ?? "Free";
  const used = billing?.usage?.messagesToday ?? 0;
  const limit = billing?.usage?.dailyLimit ?? 30;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isPaid =
    billing?.tier?.id === "starter" || billing?.tier?.id === "pro";

  const conversations: Conversation[] =
    conversationsQuery.data?.conversations ?? [];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border/60 bg-sidebar transition-[width] duration-300 ease-out z-10 shrink-0",
          isCollapsed ? "w-[64px]" : "w-[268px]",
        )}
      >
        {/* Brand */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border/50 shrink-0">
          {!isCollapsed ? (
            <Link
              href="/"
              className="flex items-center gap-2.5 font-semibold text-sidebar-foreground"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
                <img
                  src={logoUrl}
                  alt="ALKABRAIN"
                  className="w-6 h-6 rounded"
                />
              </div>
              <div className="leading-none">
                <div className="font-serif tracking-tight text-[15px]">
                  ALKABRAIN
                </div>
                <div className="text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/50 mt-0.5">
                  AI Companion
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/" className="mx-auto">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="ALKABRAIN"
                  className="w-6 h-6 rounded"
                />
              </div>
            </Link>
          )}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              aria-label="Collapse sidebar"
            >
              <SidebarIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="mx-auto mt-2 p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Expand sidebar"
          >
            <SidebarIcon className="w-4 h-4" />
          </button>
        )}

        {/* New Chat */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className={cn(
              "flex items-center justify-center w-full gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 px-3 hover:opacity-90 active:scale-[0.98] transition-all font-medium shadow-sm shadow-primary/20",
              isCollapsed && "px-0",
            )}
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            {!isCollapsed && <span className="text-sm">New Chat</span>}
          </button>
        </div>

        {/* Nav */}
        <div className="px-2 flex flex-col gap-0.5">
          <NavItem
            href="/"
            icon={<MessageSquare className="w-4 h-4" />}
            label="Chat"
            isActive={location === "/"}
            isCollapsed={isCollapsed}
          />
          <NavItem
            href="/pricing"
            icon={<Sparkles className="w-4 h-4" />}
            label="Pricing"
            isActive={location === "/pricing"}
            isCollapsed={isCollapsed}
          />
          <NavItem
            href="/help"
            icon={<LifeBuoy className="w-4 h-4" />}
            label="Help"
            isActive={location === "/help"}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Chat history */}
        {!isCollapsed && (
          <div className="flex-1 min-h-0 flex flex-col mt-3">
            <div className="px-5 pb-1 text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/40 font-medium flex items-center justify-between">
              <span>Recent chats</span>
              {conversationsQuery.isFetching && (
                <Loader2 className="w-3 h-3 animate-spin opacity-60" />
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {!isAuthenticated && (
                <p className="px-3 py-3 text-[11px] text-sidebar-foreground/55 leading-snug">
                  Sign in to save your chats. They'll show up here, unlimited.
                </p>
              )}
              {isAuthenticated && conversations.length === 0 && (
                <p className="px-3 py-3 text-[11px] text-sidebar-foreground/55 leading-snug">
                  Your chats will appear here as you go.
                </p>
              )}
              {conversations.map((c) => {
                const active = c.id === activeConversationId;
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-lg pr-1 transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80",
                    )}
                  >
                    <button
                      onClick={() => openConversation(c.id)}
                      className="flex-1 min-w-0 text-left px-3 py-2 text-[13px] truncate"
                      title={c.title}
                    >
                      {c.title}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(`Delete "${c.title}"? This can't be undone.`)
                        ) {
                          deleteMut.mutate(c.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-opacity"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {isCollapsed && <div className="flex-1" />}

        {/* Usage card */}
        {!isCollapsed && isAuthenticated && billing && (
          <div className="px-3 pb-2">
            <Link
              href="/pricing"
              className="block rounded-xl border border-sidebar-border/60 bg-gradient-to-br from-sidebar-accent/40 to-sidebar-accent/10 hover:from-sidebar-accent/60 hover:to-sidebar-accent/20 transition-colors p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-sidebar-foreground/60">
                  {tierName} plan
                </span>
                {isPaid ? (
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <span className="text-[9px] uppercase tracking-wider text-primary/80 font-semibold">
                    Upgrade
                  </span>
                )}
              </div>
              <div className="text-[12px] text-sidebar-foreground/85 mb-2 font-medium">
                {used.toLocaleString()} / {limit.toLocaleString()} today
              </div>
              <div className="h-1.5 rounded-full bg-sidebar-border/60 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    pct >= 90
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-primary/80 to-primary",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="p-2 border-t border-sidebar-border/50 space-y-1">
          {!authLoading && !isAuthenticated && (
            <button
              onClick={login}
              className={cn(
                "flex items-center gap-3 px-3 py-2 w-full rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors font-medium",
                isCollapsed && "justify-center px-0",
              )}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="text-sm">Sign in</span>}
            </button>
          )}
          {isAuthenticated && (
            <div
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 rounded-lg",
                isCollapsed && "justify-center px-0",
              )}
            >
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt=""
                  className="w-8 h-8 rounded-full shrink-0 ring-2 ring-sidebar-border/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 ring-2 ring-sidebar-border/40">
                  {(user?.firstName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
                </div>
              )}
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate text-sidebar-foreground">
                    {user?.firstName ?? user?.email ?? "Friend"}
                  </div>
                  <button
                    onClick={logout}
                    className="text-[10.5px] text-sidebar-foreground/55 hover:text-sidebar-foreground flex items-center gap-1 mt-0.5"
                  >
                    <LogOut className="w-2.5 h-2.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors",
              isCollapsed && "justify-center px-0",
            )}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 shrink-0" />
            )}
            {!isCollapsed && (
              <span className="text-sm font-medium">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            )}
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  isActive,
  isCollapsed,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const content = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        isCollapsed && "justify-center px-0",
      )}
    >
      <div
        className={cn(
          "shrink-0 transition-colors",
          isActive ? "text-primary" : "group-hover:text-primary/80",
        )}
      >
        {icon}
      </div>
      {!isCollapsed && <span className="text-sm">{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
