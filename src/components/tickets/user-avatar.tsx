import { getUser } from "@/lib/mock";
import { cn } from "@/lib/utils";

/**
 * Avatars carry a hue per person now. Eight people in one list are hard to
 * tell apart in greyscale, and an avatar is identity rather than status — so
 * this does not compete with the status and priority colours. The eight sit
 * at 45° apart on one lightness pair, so no avatar is louder than another.
 */
const paletteById: Record<string, string> = {
  "u-1": "bg-[var(--avatar-1-bg)] text-[var(--avatar-1-fg)]",
  "u-2": "bg-[var(--avatar-2-bg)] text-[var(--avatar-2-fg)]",
  "u-3": "bg-[var(--avatar-3-bg)] text-[var(--avatar-3-fg)]",
  "u-4": "bg-[var(--avatar-4-bg)] text-[var(--avatar-4-fg)]",
  "u-5": "bg-[var(--avatar-5-bg)] text-[var(--avatar-5-fg)]",
  "u-6": "bg-[var(--avatar-6-bg)] text-[var(--avatar-6-fg)]",
  "u-7": "bg-[var(--avatar-7-bg)] text-[var(--avatar-7-fg)]",
  "u-8": "bg-[var(--avatar-8-bg)] text-[var(--avatar-8-fg)]",
};

const fallback = "bg-grey-200 text-grey-700";

const sizeClass = {
  sm: "size-5 text-micro tracking-[-0.02em]",
  md: "size-6 text-micro",
  lg: "size-8 text-caption",
} as const;

export function UserAvatar({
  userId,
  size = "sm",
  className,
}: {
  userId: string | null;
  size?: keyof typeof sizeClass;
  className?: string;
}) {
  const user = getUser(userId);

  if (!user) {
    return (
      <span
        title="Unassigned"
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-dashed border-grey-300 text-grey-500",
          sizeClass[size],
          className,
        )}
      >
        <span aria-hidden>·</span>
        <span className="sr-only">Unassigned</span>
      </span>
    );
  }

  return (
    <span
      title={user.name}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold",
        paletteById[user.id] ?? fallback,
        sizeClass[size],
        className,
      )}
    >
      <span aria-hidden>{user.initials}</span>
      <span className="sr-only">{user.name}</span>
    </span>
  );
}

/**
 * A ticket can carry several assignees, and a row of full-width avatars would
 * blow out every layout that used to hold exactly one. Overlapping them keeps
 * the footprint close to a single avatar, and past `max` the tail collapses
 * into a "+n" chip rather than pushing the rest of the row around.
 */
export function AvatarStack({
  userIds,
  size = "sm",
  max = 3,
  className,
}: {
  userIds: string[];
  size?: keyof typeof sizeClass;
  max?: number;
  className?: string;
}) {
  if (userIds.length === 0) {
    return <UserAvatar userId={null} size={size} className={className} />;
  }

  const shown = userIds.slice(0, max);
  const rest = userIds.slice(max);

  return (
    <span className={cn("inline-flex items-center", className)}>
      {shown.map((id, index) => (
        <UserAvatar
          key={id}
          userId={id}
          size={size}
          // The ring separates neighbours that would otherwise read as one
          // blob; only the overlapping ones need the negative margin.
          className={cn(
            "ring-1 ring-grey-0",
            index > 0 && (size === "lg" ? "-ml-2" : "-ml-1.5"),
          )}
        />
      ))}
      {rest.length > 0 ? (
        <span
          // `title` alone is read inconsistently, and "+2" on its own tells a
          // screen reader nothing. The names go in the accessible name; the
          // "+2" glyph is then decoration.
          title={rest.map((id) => getUser(id)?.name ?? id).join(", ")}
          role="img"
          aria-label={`and ${rest.length} more: ${rest
            .map((id) => getUser(id)?.name ?? id)
            .join(", ")}`}
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-grey-200 font-semibold text-grey-600 ring-1 ring-grey-0",
            sizeClass[size],
            size === "lg" ? "-ml-2" : "-ml-1.5",
          )}
        >
          <span aria-hidden>+{rest.length}</span>
        </span>
      ) : null}
    </span>
  );
}

/** The names behind a stack, for a tooltip or a detail row. */
export function assigneeNames(userIds: string[]) {
  if (userIds.length === 0) return "Unassigned";
  return userIds.map((id) => getUser(id)?.name ?? id).join(", ");
}
