"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="rounded-sm border border-border bg-card px-6 py-5 max-w-md w-full space-y-3">
        <h2 className="text-[15px] font-semibold">Something went wrong</h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
