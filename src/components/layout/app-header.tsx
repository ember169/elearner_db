"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { CartableoMark } from "@/components/brand/mark";

/**
 * Phone header: the lockup, and settings as a 40x40 raised action.
 *
 * The family is explicit that settings is never a tab — "stats et réglages dans
 * le header, jamais d'onglet réglages" — which is what keeps the bottom bar at
 * five loop destinations. On desktop the rail carries both, so this is hidden.
 */
// Routes that cancel the root padding to run at full viewport height. Stacking
// a header above them would push the page past the viewport, and they carry
// their own title anyway.
const FULL_HEIGHT_ROUTES = ["/goals"];

export function AppHeader() {
  const pathname = usePathname();
  if (FULL_HEIGHT_ROUTES.some((r) => pathname.startsWith(r))) return null;

  return (
    <header className="flex items-center justify-between px-5 pt-3 pb-1 md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <CartableoMark size={26} />
        <span className="cb-content-title text-cb-head text-cb-text">Cartableo</span>
      </Link>
      <Link
        href="/settings"
        aria-label="Settings"
        className="flex h-10 w-10 items-center justify-center rounded-cb-card bg-cb-raised text-cb-second transition-colors active:bg-cb-raised-hover"
      >
        <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
      </Link>
    </header>
  );
}
