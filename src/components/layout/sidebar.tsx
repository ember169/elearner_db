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

const navItems = [
  { href: "/", label: "Planner", icon: CalendarDays },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/knowledge", label: "Knowledge", icon: Notebook },
  { href: "/progress", label: "Progress", icon: Map },
  { href: "/assess", label: "Assess", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

function ShieldLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M14 2L4 6.5V13C4 19.5 8.2 25.4 14 27C19.8 25.4 24 19.5 24 13V6.5L14 2Z"
        fill="var(--cb-or)"
        stroke="var(--cb-or)"
        strokeWidth="0.5"
      />
      <path
        d="M10 12L13 14.5L10 17"
        stroke="var(--cb-bg)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="14.5"
        y1="17"
        x2="18"
        y2="17"
        stroke="var(--cb-bg)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: vertical icon rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden md:flex w-14 flex-col items-center border-r border-border bg-sidebar">
        <div className="flex h-14 items-center justify-center">
          <div className="flex h-[30px] w-[30px] items-center justify-center">
            <ShieldLogo />
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
