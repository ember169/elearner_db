"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-[#131211] text-[#f7f3ea] font-sans">
        <div className="flex items-center justify-center min-h-screen">
          <div className="rounded-sm border border-[#35342f] px-6 py-5 max-w-md w-full space-y-3">
            <h2 className="text-cb-body font-semibold">Something went wrong</h2>
            <p className="text-cb-body opacity-60 leading-relaxed">
              {error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={reset}
              className="px-3 py-1.5 text-cb-body rounded-sm border border-[#35342f] hover:bg-white/5"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
