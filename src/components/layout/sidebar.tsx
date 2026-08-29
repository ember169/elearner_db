"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Map,
  Notebook,
  Settings,
  Target,
  Ellipsis,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CartableoMark } from "@/components/brand/mark";

type NavItem = { href: string; label: string; icon: typeof Map };

// The rail carries every destination; the secondary group is pinned to the
// bottom, as in the family handoff.
const PRIMARY: NavItem[] = [
  { href: "/", label: "planner", icon: CalendarDays },
  { href: "/goals", label: "goals", icon: Target },
  { href: "/learn", label: "learn", icon: BookOpen },
  { href: "/knowledge", label: "knowledge", icon: Notebook },
  { href: "/progress", label: "progress", icon: Map },
  { href: "/assess", label: "assess", icon: ClipboardCheck },
];
const SECONDARY: NavItem[] = [{ href: "/settings", label: "settings", icon: Settings }];

// The phone bar is capped at five, so the tail moves into a "more" sheet
// rather than shrinking every tap target below the family's 44px floor.
const TAB_BAR: NavItem[] = [
  { href: "/", label: "planner", icon: CalendarDays },
  { href: "/learn", label: "learn", icon: BookOpen },
  { href: "/knowledge", label: "knowledge", icon: Notebook },
  { href: "/progress", label: "progress", icon: Map },
];
const MORE: NavItem[] = [
  { href: "/goals", label: "goals", icon: Target },
  { href: "/assess", label: "assess", icon: ClipboardCheck },
  { href: "/settings", label: "settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Rail item: 72x60, radius 14, icon 21 + mono 9 label, active = a 12% accent
 *  tint block rather than a filled pill. */
function RailItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-[60px] w-[72px] flex-col items-center justify-center gap-1 rounded-[14px] transition-colors",
        active
          ? "bg-cb-or-tint text-cb-or"
          : "text-cb-muted hover:bg-cb-raised hover:text-cb-text",
      )}
    >
      <item.icon className="h-[21px] w-[21px]" strokeWidth={2} />
      <span className="cb-label-mono text-[9px] leading-none">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((i) => isActive(pathname, i.href));

  return (
    <>
      {/* Desktop rail — 96px, right hairline, lockup at top. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-24 flex-col items-center border-r border-cb-line bg-cb-bg md:flex">
        <Link href="/" className="mt-4 mb-3 flex flex-col items-center gap-[9px]">
          <CartableoMark size={38} />
          <span className="cb-content-title text-[15px] text-cb-text">Cartableo</span>
        </Link>

        <nav className="flex flex-col gap-1">
          {PRIMARY.map((item) => (
            <RailItem key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>

        <nav className="mt-auto mb-4 flex flex-col gap-1">
          {SECONDARY.map((item) => (
            <RailItem key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>
      </aside>

      {/* Phone tab bar — 52px row + safe-area spacer, top hairline. */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-cb-line bg-cb-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-[1.8] md:hidden">
        {TAB_BAR.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-[52px] flex-1 flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-cb-or" : "text-cb-muted active:text-cb-text",
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={2} />
              <span className="cb-label-mono text-[9px] leading-none">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More destinations"
          className={cn(
            "flex h-[52px] flex-1 flex-col items-center justify-center gap-1 transition-colors",
            moreActive ? "text-cb-or" : "text-cb-muted active:text-cb-text",
          )}
        >
          <Ellipsis className="h-5 w-5" strokeWidth={2} />
          <span className="cb-label-mono text-[9px] leading-none">more</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-[var(--cb-scrim)]"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[22px] border-t border-cb-line bg-cb-card pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-cb-line" />
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="cb-label-mono text-[10px] text-cb-muted">more</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="flex h-11 w-11 items-center justify-center text-cb-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="pb-3">
              {MORE.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex min-h-[52px] items-center gap-3 px-4 font-cb-sans text-[15px] font-bold transition-colors",
                    isActive(pathname, item.href)
                      ? "text-cb-or"
                      : "text-cb-text active:bg-cb-raised",
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={2} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
