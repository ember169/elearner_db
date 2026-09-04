import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Cartableo",
  description: "Personal cybersec e-learning platform",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cartableo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#131211",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <link rel="preload" href="/fonts/archivo-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/dm-serif-display-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/jetbrains-mono-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh bg-background text-foreground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <TooltipProvider>
          <div className="grid-bg fixed inset-0 pointer-events-none" />
          <Sidebar />
          <main className="relative min-h-dvh md:pl-24">
            {/* Phone only: the lockup and the settings action, which the family
                keeps out of the tab bar. */}
            <AppHeader />
            {/* Family rule: the phone bar is a 52px row plus the home
                indicator, so content clears 74px + the safe-area inset. */}
            {/* overflow-x-clip is a guardrail: a card that mis-measures on a
                narrow screen can't push a horizontal scrollbar on the whole
                page. It clips only this element's own overflow, so nested
                scrollers (the kanban) and sticky panels keep working. */}
            <div className="overflow-x-clip px-5 pt-4 pb-[calc(74px+env(safe-area-inset-bottom))] md:px-8 md:py-8">
              {children}
            </div>
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
