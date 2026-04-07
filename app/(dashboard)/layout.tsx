"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  DollarSign,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SkipLink } from "@/components/ui/skip-link";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <SkipLink targetId="main-content" />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/20 bg-white/60 backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/60 transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/20 dark:border-gray-700/20">
          <Link href="/" className="text-lg font-bold text-gray-900 dark:text-gray-100">
            RetailOps
          </Link>
          <button
            className="lg:hidden p-1 rounded-md hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4" aria-label="Main navigation">
          <ul className="flex flex-col gap-1" role="list">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                      isActive
                        ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                        : "text-gray-600 hover:bg-white/30 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/30 dark:hover:text-gray-100"
                    )}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/20 dark:border-gray-700/20 p-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-white/30 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/30 dark:hover:text-gray-100 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-white/20 bg-white/40 backdrop-blur-md px-4 dark:border-gray-700/20 dark:bg-gray-900/40 lg:px-6">
          <button
            className="rounded-lg p-2 hover:bg-white/20 dark:hover:bg-gray-800/20 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 lg:p-6" tabIndex={-1}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
