import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Wallet, TrendingUp, Settings, Plus, LayoutList, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const NAVIGATION_ITEMS = [
  { path: "/", label: "Dashboard", icon: Wallet },
  { path: "/expenses", label: "Expenses", icon: LayoutList },
  { path: "/reports", label: "Reports", icon: TrendingUp },
  { path: "/notes", label: "Notes", icon: StickyNote },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        {/* Logo/Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-sidebar-primary flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              ExpenseTrack
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:text-sidebar-primary transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="p-3 border-t border-sidebar-border">
          <Link
            to="/expenses/new"
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity",
              !sidebarOpen && "justify-center",
            )}
          >
            <Plus className="w-5 h-5" />
            {sidebarOpen && (
              <span className="text-sm font-medium">New Expense</span>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {NAVIGATION_ITEMS.find((item) => isActive(item.path))?.label ||
              "ExpenseTrack"}
          </h2>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </Button>
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              U
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
