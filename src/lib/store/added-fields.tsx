"use client";

import * as React from "react";

import { getProject, type CustomField } from "@/lib/mock";

const KEY = "uni.addedFields";

/**
 * Fields added to a project after it was created live here rather than in the
 * store's `projects` state, and that is deliberate.
 *
 * A field adds a column to the table and a row to the panel, so it changes
 * markup. The server has no localStorage, and the app's routes are
 * prerendered, so anything read from localStorage during a render makes the
 * two disagree. Folding it in from a mount effect does not fix it either:
 * subtrees hydrate at different times, so the shell's effect can land before
 * the page's subtree hydrates and the page still renders against markup that
 * no longer matches.
 *
 * `useSyncExternalStore` is the one thing that does fix it, because React
 * guarantees `getServerSnapshot` is used while a subtree hydrates and swaps
 * to the live value afterwards -- per subtree, whenever each one gets there.
 */
type Added = Record<string, CustomField[]>;

const EMPTY: Added = {};

let cache: Added | null = null;
const listeners = new Set<() => void>();

function read(): Added {
  if (cache) return cache;
  try {
    const stored = window.localStorage.getItem(KEY);
    cache = stored ? (JSON.parse(stored) as Added) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function addFieldToProject(projectId: string, field: CustomField) {
  const next: Added = { ...read() };
  next[projectId] = [...(next[projectId] ?? []), field];
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Persisting is a convenience; the field still exists for this session.
  }
  for (const fn of listeners) fn();
}

export function useAddedFields(): Added {
  return React.useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** A project's fields: the ones it shipped with, plus anything added since. */
export function useProjectFields(projectId: string | undefined): CustomField[] {
  const added = useAddedFields();
  return React.useMemo(() => {
    if (!projectId) return [];
    const base = getProject(projectId)?.customFields ?? [];
    const extra = added[projectId];
    return extra && extra.length > 0 ? [...base, ...extra] : base;
  }, [added, projectId]);
}
