"use client";

import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Home, CheckCircle, TrendingUp, Settings, LayoutDashboard, MapPin, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    mode: "home" as const,
    description: "Overview & insights",
  },
  {
    href: "/checkin",
    label: "Check-In",
    icon: CheckCircle,
    mode: "checkin" as const,
    description: "Field support",
  },
  {
    href: "/coaching",
    label: "Coaching",
    icon: TrendingUp,
    mode: "coaching" as const,
    description: "Performance coaching",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    mode: "settings" as const,
    description: "Preferences",
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { setActiveMode } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setActiveMode(item.mode)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const { setActiveMode, currentDSR } = useStore();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:border-r md:bg-muted/30">
      <div className="flex flex-col gap-6 p-4 pt-20">
        {/* User Info Section */}
        <div className="lg:hidden px-3 pb-4 border-b">
          <p className="text-sm font-medium mb-1">{currentDSR?.dsr_name}</p>
          <p className="text-xs text-muted-foreground">
            {currentDSR?.route_id} • {currentDSR?.region}
          </p>
        </div>

        {/* Navigation Section */}
        <nav className="flex flex-col gap-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setActiveMode(item.mode)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary-foreground")} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.label}</span>
                  {!isActive && (
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats Section */}
        {currentDSR && (
          <div className="mt-auto px-3 py-4 rounded-lg bg-muted">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Today's Stats
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Target</span>
                <span className="text-xs font-semibold">{currentDSR.target_achievement}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Outlets</span>
                <span className="text-xs font-semibold">
                  {currentDSR.outlets_visited}/{currentDSR.outlets_to_sell_to}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Efficiency</span>
                <span className="text-xs font-semibold">{currentDSR.route_efficiency_score.toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
