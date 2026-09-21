"use client";

import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProject, type CustomField, type Ticket } from "@/lib/mock";
import { useProjectFields } from "@/lib/store/added-fields";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-7 w-full rounded-md border border-transparent bg-transparent px-1.5 text-small text-grey-900 transition-colors hover:bg-grey-100 focus:border-accent-600 focus:bg-transparent focus:outline-none";

export function formatCustomValue(
  field: CustomField,
  value: unknown,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (field.type === "checkbox") return value ? "Yes" : null;
  if (field.type === "date" && typeof value === "string") {
    // The input stores 2026-09-30; everything else in the product writes
    // "30 Sept 2026", and a field should not read differently because a
    // project happened to define it.
    const parsed = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  return String(value);
}


/**
 * One field's control, independent of any ticket. The panel edits a ticket
 * that exists; the create form edits one that does not yet, and both need the
 * same three shapes (select, checkbox, typed input) to behave identically --
 * otherwise a project's own field means one thing at creation and another
 * afterwards.
 */
export function CustomFieldControl({
  field,
  value,
  onChange,
  className,
}: {
  field: CustomField;
  value: unknown;
  onChange: (next: unknown) => void;
  className?: string;
}) {
  if (field.type === "select") {
    return (
      <Select
        value={typeof value === "string" && value ? value : "none"}
        onValueChange={(next) => onChange(next === "none" ? null : next)}
      >
        <SelectTrigger
          className={cn(fieldClass, "justify-between", className)}
          aria-label={field.name}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-grey-500">Not set</span>
          </SelectItem>
          {(field.options ?? []).map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <span className="flex h-7 items-center px-1.5">
        <Checkbox
          checked={value === true}
          onCheckedChange={(next) => onChange(next === true)}
          aria-label={field.name}
        />
      </span>
    );
  }

  return (
    <input
      type={
        field.type === "number"
          ? "number"
          : field.type === "date"
            ? "date"
            : "text"
      }
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(event) => {
        const raw = event.target.value;
        onChange(
          raw === "" ? null : field.type === "number" ? Number(raw) : raw,
        );
      }}
      aria-label={field.name}
      placeholder="—"
      className={cn(fieldClass, className)}
    />
  );
}

/**
 * A project's own fields, rendered from its schema. The shared model can never
 * carry everything — a customer on a support queue, a Figma link on a design
 * project — and the alternative is a convention in the description that
 * nothing can sort, group or filter on.
 */
export function CustomFields({
  ticket,
  canEdit,
}: {
  ticket: Ticket;
  canEdit: boolean;
}) {
  const { updateTicket } = useTicketStore();
  const project = getProject(ticket.projectId);
  const fields = useProjectFields(ticket.projectId);

  if (fields.length === 0) return null;

  const set = (fieldId: string, value: unknown) =>
    updateTicket(ticket.id, {
      custom: { ...(ticket.custom ?? {}), [fieldId]: value as never },
    });

  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
        {project?.name} fields
      </h3>

      {fields.map((field) => {
        const value = ticket.custom?.[field.id] ?? null;

        return (
          <div
            key={field.id}
            className="grid grid-cols-[92px_1fr] items-center gap-2"
          >
            <span className="text-caption text-grey-500">{field.name}</span>

            {!canEdit ? (
              <span className="px-1.5 text-small text-grey-700">
                {formatCustomValue(field, value) ?? "—"}
              </span>
            ) : (
              <CustomFieldControl
                field={field}
                value={value}
                onChange={(next) => set(field.id, next)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
