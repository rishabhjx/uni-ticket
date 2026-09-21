"use client";

import * as React from "react";
import { ListPlus } from "lucide-react";

import { useCelebrate } from "@/components/shared/celebrate";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRENT_USER_ID,
  canAdminister,
  CUSTOM_FIELD_TYPES,
  type CustomField,
  type Project,
} from "@/lib/mock";
import { addFieldToProject } from "@/lib/store/added-fields";

const TYPE_LABEL: Record<CustomField["type"], string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  select: "Choice",
  checkbox: "Yes / no",
};

const inputClass =
  "h-8 w-full rounded-md border border-grey-200 px-2.5 text-small text-grey-900 transition-colors placeholder:text-grey-500 hover:border-grey-300 focus:border-accent-600 focus:outline-none";

/**
 * A project's own fields could only be defined at the moment the project was
 * created -- which is the moment you know least about what you will need. By
 * the time you know you want "Customer" on every ticket, the only way to get
 * it was to make a new project.
 */
export function AddFieldPopover({ project }: { project: Project }) {
  const celebrate = useCelebrate();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<CustomField["type"]>("text");
  const [options, setOptions] = React.useState("");
  const [onCard, setOnCard] = React.useState(false);

  if (!canAdminister(project, CURRENT_USER_ID)) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    addFieldToProject(project.id, {
      id: `cf-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      name: trimmed,
      type,
      showOnCard: onCard,
      ...(type === "select"
        ? {
            options: options
              .split(",")
              .map((option) => option.trim())
              .filter(Boolean),
          }
        : {}),
    });

    celebrate("＋", `"${trimmed}" added to ${project.name}`);
    setName("");
    setOptions("");
    setOnCard(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Add a field to ${project.name}`}
          title={`Add a field to ${project.name}`}
          className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
        >
          <ListPlus className="size-4" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <form onSubmit={submit} className="flex flex-col gap-2.5 p-3">
          <p className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
            New field on {project.name}
          </p>

          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Field name"
            aria-label="Field name"
            className={inputClass}
          />

          <Select
            value={type}
            onValueChange={(next) => setType(next as CustomField["type"])}
          >
            <SelectTrigger className="h-8 text-small" aria-label="Field type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOM_FIELD_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {TYPE_LABEL[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {type === "select" ? (
            <input
              value={options}
              onChange={(event) => setOptions(event.target.value)}
              placeholder="Choices, comma separated"
              aria-label="Choices"
              className={inputClass}
            />
          ) : null}

          <label className="flex items-center gap-2 text-small text-grey-700">
            <input
              type="checkbox"
              checked={onCard}
              onChange={(event) => setOnCard(event.target.checked)}
              className="size-3.5 accent-[var(--accent-600)]"
            />
            Show it on the board card
          </label>

          <button
            type="submit"
            disabled={name.trim() === ""}
            className="h-8 rounded-md bg-accent-600 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-100 disabled:text-grey-600"
          >
            Add field
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
