"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Map,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CartableoMark } from "@/components/brand/mark";

type NavItem = { href: string; label: string; icon: typeof Map };

// Three destinations, ordered on the learning loop rather than on an inventory
// of features: see/plan what to do, understand it, prove it. Home carries both
// the Today digest and the Board under one view-switcher, so the board is no
// longer its own tab. The family caps its bars at five and orders them the same
// way; we sit well under that.
//
// Goals and Assess are still full pages at /goals and /assess — they are simply
// not destinations. Progress is where you enter them.
const NAV: NavItem[] = [
  { href: "/", label: "home", icon: LayoutDashboard },
  { href: "/learn", label: "learn", icon: BookOpen },
  { href: "/progress", label: "progress", icon: Map },
];

// Settings is never a tab (family rule). On the rail it sits in the pinned
// bottom group; on a phone it lives in the header instead.
const SECONDARY: NavItem[] = [{ href: "/settings", label: "settings", icon: Settings }];

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

  return (
    <>
      {/* Desktop rail — 96px, right hairline, lockup at top. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-24 flex-col items-center border-r border-cb-line bg-cb-bg md:flex">
        <Link href="/" className="mt-4 mb-3 flex flex-col items-center gap-[9px]">
          <CartableoMark size={38} />
          <span className="cb-content-title text-[15px] text-cb-text">Cartableo</span>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <RailItem key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>

        <nav className="mt-auto mb-4 flex flex-col gap-1">
          {SECONDARY.map((item) => (
            <RailItem key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>
      </aside>

      {/* Phone tab bar — 52px row + safe-area spacer, top hairline. Three loop
          destinations: nothing overflows into a "more" sheet, which is the whole
          point of cutting the nav down. */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-cb-line bg-cb-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-[1.8] md:hidden">
        {NAV.map((item) => {
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
      </nav>
    </>
  );
}
