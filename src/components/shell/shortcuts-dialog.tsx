"use client";

import { Kbd, KbdGroup } from "@/components/reui/kbd";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Every shortcut this app answers to, in one sheet reachable with `?`. The
 * keys are ReUI's Kbd, which is what the palette and the sidebar hints use
 * too, so a keycap looks the same wherever it appears.
 */
const GROUPS: { name: string; items: { keys: string[]; does: string }[] }[] = [
  {
    name: "Getting around",
    items: [
      { keys: ["⌘", "K"], does: "Open the command palette" },
      { keys: ["⌘", "B"], does: "Show or hide the sidebar" },
      { keys: ["?"], does: "Open this sheet" },
      { keys: ["Esc"], does: "Close the panel, a dialog or the palette" },
    ],
  },
  {
    name: "Tickets",
    items: [
      { keys: ["C"], does: "New ticket" },
      { keys: ["⌘", "↵"], does: "Send a comment" },
    ],
  },
];

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            The ones worth learning. Typing in a field never triggers them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {GROUPS.map((group) => (
            <section key={group.name}>
              <h3 className="mb-2 text-caption font-semibold tracking-[0.07em] text-grey-500 uppercase">
                {group.name}
              </h3>
              <ul className="flex flex-col">
                {group.items.map((item) => (
                  <li
                    key={item.does}
                    className="flex h-8 items-center justify-between gap-4"
                  >
                    <span className="text-small text-grey-700">{item.does}</span>
                    <KbdGroup>
                      {item.keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </KbdGroup>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
