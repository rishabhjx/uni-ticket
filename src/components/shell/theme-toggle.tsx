"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/store/theme";

/**
 * One control, two states, no menu: there is no third option worth a popover.
 * The icon shows the theme you would SWITCH TO, which is the convention every
 * OS uses and the only one that reads correctly at 14px.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
    >
      {theme === "light" ? (
        <Moon className="size-3.5" strokeWidth={1.75} />
      ) : (
        <Sun className="size-3.5" strokeWidth={1.75} />
      )}
    </button>
  );
}
