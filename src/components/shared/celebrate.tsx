"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A small, short-lived acknowledgement when work actually gets finished.
 * It never blocks anything and never asks to be dismissed — it says well
 * done and gets out of the way.
 */
type Celebration = {
  id: number;
  emoji: string;
  message: string;
  undo?: () => void;
};

const CelebrateContext = React.createContext<
  ((emoji: string, message: string, undo?: () => void) => void) | null
>(null);

const cheers = ["🎉", "🙌", "✨", "🚀", "💫"];

export function CelebrateProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Celebration[]>([]);
  const nextId = React.useRef(0);

  const celebrate = React.useCallback(
    (emoji: string, message: string, undo?: () => void) => {
      nextId.current += 1;
      const id = nextId.current;
      setItems((current) => [...current, { id, emoji, message, undo }]);
      // An undoable action stays up longer, because it is asking a question.
      window.setTimeout(
        () => setItems((current) => current.filter((item) => item.id !== id)),
        undo ? 6000 : 2600,
      );
    },
    [],
  );

  return (
    <CelebrateContext value={celebrate}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "glass-strong flex items-center gap-2 rounded-md border border-grey-200 px-3 py-2 shadow-overlay",
              "animate-in fade-in-0 slide-in-from-bottom-2",
            )}
          >
            <span aria-hidden className="text-base">
              {item.emoji}
            </span>
            <span className="text-small font-medium text-grey-900">
              {item.message}
            </span>
            {item.undo ? (
              <button
                type="button"
                onClick={() => {
                  item.undo?.();
                  setItems((current) =>
                    current.filter((entry) => entry.id !== item.id),
                  );
                }}
                className="pointer-events-auto ml-1 h-6 rounded-md border border-grey-300 px-2 text-caption font-medium text-grey-800 transition-colors hover:border-grey-400"
              >
                Undo
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </CelebrateContext>
  );
}

export function useCelebrate() {
  const celebrate = React.use(CelebrateContext);
  if (!celebrate) {
    throw new Error("useCelebrate must be used inside <CelebrateProvider>");
  }
  return celebrate;
}

export function randomCheer() {
  return cheers[Math.floor(Math.random() * cheers.length)];
}
