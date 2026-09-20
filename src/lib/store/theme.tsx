"use client";

import * as React from "react";

/**
 * Dark is the default, so an unset preference never flashes: the tokens in
 * `:root` are already the dark ones and `html.light` re-grades them. The
 * choice lives on the <html> element rather than in React state because the
 * inline script in the document head has to apply it before first paint —
 * React is far too late to stop a white flash on a dark app.
 */
export type Theme = "dark" | "light";

export const THEME_KEY = "uni:theme";

/**
 * Runs before paint, inlined into <head>. Kept as a string so it cannot drift
 * from the class name this module toggles.
 */
export const themeBootScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(!t){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}if(t==="light"){document.documentElement.classList.add("light");document.documentElement.classList.remove("dark")}}catch(e){}`;

function current(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  // ReUI's stylesheet keys its dark rules off `.dark`, so the class has to
  // come off as well as ours going on.
  root.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode: the toggle still works for this session.
  }
  for (const fn of listeners) fn();
}

/**
 * The server renders dark, which is what `:root` says, so the server snapshot
 * is "dark" and hydration matches even when the boot script has already
 * switched the class.
 */
export function useTheme() {
  const theme = React.useSyncExternalStore(
    subscribe,
    current,
    () => "dark" as Theme,
  );
  const setTheme = React.useCallback((next: Theme) => apply(next), []);
  const toggle = React.useCallback(
    () => apply(current() === "light" ? "dark" : "light"),
    [],
  );
  return { theme, setTheme, toggle };
}
