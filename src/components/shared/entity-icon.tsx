import { cn } from "@/lib/utils";

/**
 * A tinted monogram tile for a project or a workspace — the emoji it used to
 * carry read as a placeholder nobody had gotten around to replacing, which is
 * the fastest way anything looks cheap. Square, not round, so it never gets
 * mistaken for a person's avatar; the hue is picked from the same eight-tone
 * ramp people use, but keyed off the entity's own id so a given project or
 * workspace always lands on the same tone.
 */
const toneCount = 8;

function toneOf(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return (hash % toneCount) + 1;
}

const sizeClass = {
  xs: "size-4 rounded-[5px] text-[9px]",
  sm: "size-5 rounded-[6px] text-[10px]",
  md: "size-7 rounded-md text-caption",
  lg: "size-9 rounded-md text-small",
  xl: "size-11 rounded-lg text-heading",
} as const;

export type EntityIconSize = keyof typeof sizeClass;

function Tile({
  id,
  label,
  size,
  className,
}: {
  id: string;
  label: string;
  size: EntityIconSize;
  className?: string;
}) {
  const tone = toneOf(id);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold tracking-tight",
        sizeClass[size],
        className,
      )}
      style={{
        backgroundColor: `var(--avatar-${tone}-bg)`,
        color: `var(--avatar-${tone}-fg)`,
      }}
    >
      {label}
    </span>
  );
}

export function ProjectIcon({
  project,
  size = "md",
  className,
}: {
  project: { id: string; key: string };
  size?: EntityIconSize;
  className?: string;
}) {
  return (
    <Tile
      id={project.id}
      label={project.key.slice(0, 2).toUpperCase()}
      size={size}
      className={className}
    />
  );
}

export function WorkspaceIcon({
  workspace,
  size = "md",
  className,
}: {
  workspace: { id: string; name: string };
  size?: EntityIconSize;
  className?: string;
}) {
  const initials =
    workspace.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "W";

  return (
    <Tile id={workspace.id} label={initials} size={size} className={className} />
  );
}
