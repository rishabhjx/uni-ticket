import { getUser } from "@/lib/mock";
import { cn } from "@/lib/utils";

/**
 * Avatars carry a hue per person now. Eight people in one list are hard to
 * tell apart in greyscale, and an avatar is identity rather than status — so
 * this does not compete with the status and priority colours.
 */
const paletteById: Record<string, string> = {
  "u-1": "bg-[#e8e2ff] text-[#4c3a9e]",
  "u-2": "bg-[#ffe3e8] text-[#9c2f45]",
  "u-3": "bg-[#dff0e4] text-[#26663f]",
  "u-4": "bg-[#ffe8d4] text-[#95531b]",
  "u-5": "bg-[#d9ecf7] text-[#1f5876]",
  "u-6": "bg-[#fdeacb] text-[#87621a]",
  "u-7": "bg-[#e6e6f5] text-[#454585]",
  "u-8": "bg-[#f7dff0] text-[#8a2f72]",
};

const fallback = "bg-grey-200 text-grey-700";

const sizeClass = {
  sm: "size-5 text-[9px]",
  md: "size-6 text-[10px]",
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
          "inline-flex items-center justify-center rounded-full border border-dashed border-grey-300 text-grey-400",
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
