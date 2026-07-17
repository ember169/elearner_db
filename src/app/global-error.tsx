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
      <body className="min-h-full bg-[oklch(0.135_0.004_75)] text-[oklch(0.93_0.01_85)] font-sans">
        <div className="flex items-center justify-center min-h-screen">
          <div className="rounded-sm border border-[oklch(0.25_0.007_70)] px-6 py-5 max-w-md w-full space-y-3">
            <h2 className="text-[15px] font-semibold">Something went wrong</h2>
            <p className="text-[13px] opacity-60 leading-relaxed">
              {error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={reset}
              className="px-3 py-1.5 text-[13px] rounded-sm border border-[oklch(0.25_0.007_70)] hover:bg-white/5"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
