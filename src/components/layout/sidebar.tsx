"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Map,
  Target,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Planner", icon: CalendarDays },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/progress", label: "Progress", icon: Map },
  { href: "/settings", label: "Settings", icon: Settings },
];

function ShieldLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M14 2L4 6.5V13C4 19.5 8.2 25.4 14 27C19.8 25.4 24 19.5 24 13V6.5L14 2Z"
        fill="oklch(0.82 0.055 80)"
        stroke="oklch(0.82 0.055 80)"
        strokeWidth="0.5"
      />
      <path
        d="M10 12L13 14.5L10 17"
        stroke="#1a1916"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="14.5"
        y1="17"
        x2="18"
        y2="17"
        stroke="#1a1916"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-1.5 rounded-sm border border-border bg-background/80 backdrop-blur-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-14 flex-col items-center border-r border-border bg-sidebar transition-transform duration-200 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
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
                onClick={() => setMobileOpen(false)}
                title={item.label}
                className={cn(
                  "flex h-[40px] w-[40px] items-center justify-center rounded-sm transition-colors",
                  isActive
                    ? "bg-[oklch(0.82_0.055_80/0.1)]"
                    : "hover:bg-[rgba(237,232,220,0.05)]"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive
                      ? "text-[oklch(0.82_0.055_80)]"
                      : "text-[rgba(237,232,220,0.35)] hover:text-[rgba(237,232,220,0.7)]"
                  )}
                />
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
