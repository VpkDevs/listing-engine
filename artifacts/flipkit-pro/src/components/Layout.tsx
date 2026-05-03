import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Tag, 
  LayoutDashboard, 
  Wand2, 
  ListTree, 
  Calculator, 
  Search, 
  FileText, 
  LineChart, 
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Listing Generator", icon: Wand2 },
  { href: "/bulk-optimizer", label: "Bulk Optimizer", icon: ListTree },
  { href: "/pricing", label: "Pricing Calculator", icon: Calculator },
  { href: "/keywords", label: "Keyword Research", icon: Search },
  { href: "/templates", label: "Templates Library", icon: FileText },
  { href: "/tracker", label: "Profit Tracker", icon: LineChart },
  { href: "/condition", label: "Condition Helper", icon: ClipboardList },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="bg-primary/20 p-2 rounded-md">
            <Tag className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">FlipKit Pro</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border text-xs text-muted-foreground text-center">
          FlipKit Pro v1.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
