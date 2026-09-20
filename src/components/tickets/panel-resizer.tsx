"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const PANEL_MIN = 380;
export const PANEL_DEFAULT = 460;
export const PANEL_MAX_MARGIN = 120;
const STORAGE_KEY = "uni.panel.width";

/**
 * The remembered width lives in localStorage, which is an external store, so
 * it is read through useSyncExternalStore rather than set in an effect: the
 * server snapshot is the default, the client snapshot is whatever was saved,
 * and there is no extra render pass for the compiler to object to. Same shape
 * the sidebar's open state already uses.
 */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : PANEL_DEFAULT;
  } catch {
    // Private windows and blocked site data both throw here; the default is
    // a perfectly good answer.
    return PANEL_DEFAULT;
  }
}

function getServerSnapshot() {
  return PANEL_DEFAULT;
}

export function writePanelWidth(width: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(width));
  } catch {
    // Not being able to remember the width is not worth failing a drag over.
  }
  for (const listener of listeners) listener();
}

export function useStoredPanelWidth() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * The grab strip on the panel's leading edge. It is 8px of hit area over a
 * 1px visual line, because a 1px target is a dexterity test rather than a
 * control - the same reason every editor's splitter is wider than it looks.
 *
 * Pointer capture is what makes the drag survive the cursor leaving the strip,
 * which is otherwise the first thing that breaks once you move fast.
 */
export function PanelResizer({
  width,
  onWidth,
  disabled,
}: {
  width: number;
  onWidth: (width: number) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = React.useState(false);

  const clamp = React.useCallback(
    (value: number) =>
      Math.round(
        Math.min(
          Math.max(value, PANEL_MIN),
          Math.max(PANEL_MIN, window.innerWidth - PANEL_MAX_MARGIN),
        ),
      ),
    [],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    // The panel is pinned to the right edge, so its width is the distance
    // from the pointer to that edge.
    onWidth(clamp(window.innerWidth - event.clientX));
  };

  const stop = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    writePanelWidth(width);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the ticket panel"
      aria-valuenow={width}
      aria-valuemin={PANEL_MIN}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
      onDoubleClick={() => onWidth(clamp(460))}
      // Keyboard parity, because a splitter that only answers to a mouse is
      // not a control everyone has.
      onKeyDown={(event) => {
        const step = event.shiftKey ? 64 : 16;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          const next = clamp(width + step);
          onWidth(next);
          writePanelWidth(next);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          const next = clamp(width - step);
          onWidth(next);
          writePanelWidth(next);
        }
      }}
      className={cn(
        "group/resizer absolute inset-y-0 left-0 z-10 w-2 -translate-x-1/2 cursor-col-resize touch-none",
        "focus-visible:outline-none max-md:hidden",
        disabled && "pointer-events-none",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors",
          dragging
            ? "bg-accent-600"
            : "bg-transparent group-hover/resizer:bg-accent-600 group-focus-visible/resizer:bg-accent-600",
        )}
      />
    </div>
  );
}
