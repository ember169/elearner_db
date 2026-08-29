"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Notebook,
  ClipboardCheck,
  Map,
  Target,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CartableoMark } from "@/components/brand/mark";

const navItems = [
  { href: "/", label: "Planner", icon: CalendarDays },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/knowledge", label: "Knowledge", icon: Notebook },
  { href: "/progress", label: "Progress", icon: Map },
  { href: "/assess", label: "Assess", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: vertical icon rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden md:flex w-14 flex-col items-center border-r border-border bg-sidebar">
        <div className="flex h-14 items-center justify-center">
          <div className="flex h-[30px] w-[30px] items-center justify-center">
            <CartableoMark size={28} />
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 mt-3.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex h-[40px] w-[40px] items-center justify-center rounded-sm transition-colors",
                  isActive
                    ? "bg-primary/10"
                    : "hover:bg-accent"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile: iOS-style bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-stretch justify-around bg-sidebar/80 backdrop-blur-xl backdrop-saturate-[1.8] pb-[env(safe-area-inset-bottom)]" style={{ borderTop: "0.33px solid var(--cb-line)" }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 pt-1.5 pb-0.5 min-h-[49px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <item.icon className="h-[22px] w-[22px]" strokeWidth={2} />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
