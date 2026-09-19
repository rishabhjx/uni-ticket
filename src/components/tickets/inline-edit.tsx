"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Click to edit, Escape to abandon. QA correcting repro steps and a developer
 * adding findings both need this, and neither should have to leave the panel.
 */
export function InlineEdit({
  value,
  onSave,
  multiline = false,
  placeholder,
  className,
  editClassName,
  children,
  label,
}: {
  value: string;
  onSave: (next: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  editClassName?: string;
  children: React.ReactNode;
  label: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  // Switching ticket while an editor is open must not carry the draft over.
  const [lastValue, setLastValue] = React.useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (!editing) setDraft(value);
  }

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        aria-label={`Edit ${label}`}
        className={cn(
          "-mx-1.5 w-[calc(100%+12px)] rounded-md px-1.5 py-1 text-left transition-colors hover:bg-grey-100",
          className,
        )}
      >
        {children}
      </button>
    );
  }

  const shared = cn(
    "-mx-1.5 w-[calc(100%+12px)] rounded-md border border-accent-600 px-1.5 py-1 focus:outline-none",
    editClassName,
  );

  return multiline ? (
    <textarea
      autoFocus
      value={draft}
      rows={10}
      placeholder={placeholder}
      aria-label={label}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) commit();
      }}
      className={cn(shared, "resize-y font-mono text-[12px] leading-[18px]")}
    />
  ) : (
    <input
      autoFocus
      value={draft}
      placeholder={placeholder}
      aria-label={label}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
        if (event.key === "Enter") commit();
      }}
      className={shared}
    />
  );
}
