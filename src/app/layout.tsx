import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Learner DB",
  description: "Personal learning dashboard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Learner DB",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1f1d19",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-dvh bg-background text-foreground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <TooltipProvider>
          <div className="grid-bg fixed inset-0 pointer-events-none" />
          <Sidebar />
          <main className="md:pl-14 min-h-dvh relative">
            <div className="px-5 pt-4 pb-20 md:px-8 md:py-8 md:pb-8">{children}</div>
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
