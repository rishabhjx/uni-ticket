"use client";

import { Kbd } from "@/components/reui/kbd";
import { useShell } from "@/hooks/use-shell";

/**
 * The shortcuts sheet was reachable only by pressing `?`, and the only place
 * that said so was the sheet itself. A feature whose sole advertisement is
 * inside the feature is a feature nobody finds.
 *
 * It shows the key rather than a question-mark icon, because the thing worth
 * teaching is the key, not that help exists.
 */
export function ShortcutHint() {
  const { setShortcutsOpen } = useShell();
  return (
    <button
      type="button"
      onClick={() => setShortcutsOpen(true)}
      aria-label="Keyboard shortcuts"
      title="Keyboard shortcuts"
      className="tap flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900 max-sm:hidden"
    >
      <Kbd>?</Kbd>
    </button>
  );
}
