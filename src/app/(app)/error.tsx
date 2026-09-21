"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";

/**
 * Nothing in this prototype modelled a failure: there was no error state
 * anywhere, so the one thing the UI could not show was the one thing a person
 * most needs help with. This is the route-level boundary -- anything a view
 * throws lands here instead of blanking the page.
 *
 * It keeps the shell (rail, top bar) because the boundary sits inside the
 * layout: a failure in one view should not take the navigation with it.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5 px-6 py-16 text-center">
      <span
        aria-hidden
        className="mb-2 flex size-14 items-center justify-center rounded-full bg-[var(--danger-bg)] text-2xl"
      >
        ⚠️
      </span>
      <h2 className="text-heading font-semibold text-grey-900">
        This view could not load
      </h2>
      <p className="max-w-sm text-small text-grey-600">
        Something went wrong rendering it. Nothing you were working on has been
        lost — the rest of the app is still fine.
      </p>
      {error.digest ? (
        <p className="tnum mt-1 text-caption text-grey-500">
          Reference {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-4 flex h-8 items-center gap-1.5 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-[background-color,transform] hover:bg-accent-700 active:scale-[0.98]"
      >
        <RotateCcw className="size-3.5" strokeWidth={2} />
        Try again
      </button>
    </div>
  );
}
