import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  Tag,
  Wand2,
  ListTree,
  Calculator,
  Search,
  FileText,
  LineChart,
  ClipboardList,
  Sun,
  Moon,
  TrendingUp,
  Zap,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { getGeminiKey, setGeminiKey } from "@/lib/aiEnhance";

const NAV_ITEMS = [
  { href: "/", label: "Listing Generator", icon: Wand2, shortcut: "G" },
  { href: "/bulk-optimizer", label: "Bulk Optimizer", icon: ListTree },
  { href: "/pricing", label: "Pricing Calculator", icon: Calculator, shortcut: "P" },
  { href: "/keywords", label: "Keyword Research", icon: Search, shortcut: "K" },
  { href: "/templates", label: "Templates Library", icon: FileText },
  { href: "/tracker", label: "Profit Tracker", icon: LineChart },
  { href: "/condition", label: "Condition Helper", icon: ClipboardList },
];

function AiSettingsButton() {
  const [open, setOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    if (open) {
      setHasKey(getGeminiKey() !== null);
      setKeyInput("");
    }
  }, [open ]);

  const handleSave = () => {
    setGeminiKey(keyInput);
    setHasKey(getGeminiKey() !== null);
    setKeyInput("");
  };

  const handleClear = () => {
    setGeminiKey("");
    setHasKey(false);
    setKeyInput("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          data-testid="button-ai-settings"
        >
          <span>AI Settings</span>
          <Sparkles className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Settings — bring your own key</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The "Enhance with AI" button in the Listing Generator uses your own free
            Google Gemini API key. The key is stored only in this browser and is sent
            only to Google when you click Enhance. FlipKit never sees or stores it on
            any server. Without a key, every tool keeps working with the built-in
            deterministic drafts.
          </p>
          <p className="text-sm text-muted-foreground">
            Get a free key from Google AI Studio (aistudio.google.com/apikey), then
            paste it here.
          </p>
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Gemini API Key</Label>
            <Input
              id="gemini-key"
              type="password"
              placeholder={hasKey ? "A key is saved — paste to replace it" : "AIza…"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              data-testid="input-gemini-key"
            />
            <p className="text-xs text-muted-foreground">
              Status: {hasKey ? "Key saved in this browser ✓" : "No key saved"}
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {hasKey && (
            <Button variant="outline" onClick={handleClear}>
              Remove Key
            </Button>
          )}
          <Button onClick={handleSave} disabled={!keyInput.trim()}>
            Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getStats() {
  try {
    const listings = Number(localStorage.getItem("flipkit-stats-listings") || 0);
    const titles = Number(localStorage.getItem("flipkit-stats-titles") || 0);
    const sales: Array<{ profit: number }> = JSON.parse(
      localStorage.getItem("flipkit-sales") || "[]"
    );
    const profit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
    return { listings, titles, profit };
  } catch {
    return { listings: 0, titles: 0, profit: 0 };
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("flipkit-theme") as "dark" | "light") || "dark";
  });
  const [stats, setStats] = useState(getStats);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("flipkit-theme", theme);
  }, [theme]);

  const refreshStats = useCallback(() => setStats(getStats()), []);

  useEffect(() => {
    refreshStats();
    window.addEventListener("focus", refreshStats);
    window.addEventListener("flipkit-stats-updated", refreshStats);
    return () => {
      window.removeEventListener("focus", refreshStats);
      window.removeEventListener("flipkit-stats-updated", refreshStats);
    };
  }, [refreshStats]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        if (e.key === "g") { e.preventDefault(); setLocation("/"); }
        if (e.key === "p") { e.preventDefault(); setLocation("/pricing"); }
        if (e.key === "k") { e.preventDefault(); setLocation("/keywords"); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setLocation]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="bg-primary/20 p-2 rounded-md">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight text-sidebar-foreground">
            FlipKit Pro
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                  data-testid={`nav-${item.href.replace("/", "") || "home"}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  {item.shortcut && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono opacity-60">
                      ^{item.shortcut}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer: AI settings, theme toggle, version */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <AiSettingsButton />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            data-testid="button-theme-toggle"
          >
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <p className="text-xs text-muted-foreground text-center">FlipKit Pro v1.0</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Quick Stats Banner */}
        <div className="border-b border-border bg-card px-6 py-2.5 flex items-center gap-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Listings Generated:</span>
            <motion.span
              key={stats.listings}
              initial={{ scale: 1.3, color: "hsl(38 92% 50%)" }}
              animate={{ scale: 1, color: "inherit" }}
              className="font-bold text-foreground"
              data-testid="stat-listings"
            >
              {stats.listings.toLocaleString()}
            </motion.span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Titles Optimized:</span>
            <motion.span
              key={stats.titles}
              initial={{ scale: 1.3, color: "hsl(38 92% 50%)" }}
              animate={{ scale: 1, color: "inherit" }}
              className="font-bold text-foreground"
              data-testid="stat-titles"
            >
              {stats.titles.toLocaleString()}
            </motion.span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-3.5 h-3.5 text-green-500" />
            <span className="text-muted-foreground">Total Profit Tracked:</span>
            <motion.span
              key={stats.profit.toFixed(0)}
              initial={{ scale: 1.3, color: "hsl(142 71% 45%)" }}
              animate={{ scale: 1, color: "inherit" }}
              className="font-bold text-green-500"
              data-testid="stat-profit"
            >
              ${stats.profit.toFixed(2)}
            </motion.span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
