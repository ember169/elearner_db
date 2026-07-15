import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Learner DB",
  description: "Personal learning dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <TooltipProvider>
            <div className="grid-bg fixed inset-0 pointer-events-none" />
            <Sidebar />
            <main className="md:pl-56 min-h-screen relative">
              <div className="px-5 pt-16 pb-6 md:px-8 md:py-8 max-w-5xl">{children}</div>
            </main>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
