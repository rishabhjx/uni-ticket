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
  return String(value);
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
  const fields = getProject(ticket.projectId)?.customFields ?? [];

  if (fields.length === 0) return null;

  const set = (fieldId: string, value: unknown) =>
    updateTicket(ticket.id, {
      custom: { ...(ticket.custom ?? {}), [fieldId]: value as never },
    });

  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
        {getProject(ticket.projectId)?.name} fields
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
            ) : field.type === "select" ? (
              <Select
                value={typeof value === "string" && value ? value : "none"}
                onValueChange={(next) =>
                  set(field.id, next === "none" ? null : next)
                }
              >
                <SelectTrigger
                  className={cn(fieldClass, "justify-between")}
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
            ) : field.type === "checkbox" ? (
              <span className="flex h-7 items-center px-1.5">
                <Checkbox
                  checked={value === true}
                  onCheckedChange={(next) => set(field.id, next === true)}
                  aria-label={field.name}
                />
              </span>
            ) : (
              <input
                type={
                  field.type === "number"
                    ? "number"
                    : field.type === "date"
                      ? "date"
                      : "text"
                }
                value={value === null ? "" : String(value)}
                onChange={(event) => {
                  const raw = event.target.value;
                  set(
                    field.id,
                    raw === ""
                      ? null
                      : field.type === "number"
                        ? Number(raw)
                        : raw,
                  );
                }}
                aria-label={field.name}
                placeholder="—"
                className={fieldClass}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
