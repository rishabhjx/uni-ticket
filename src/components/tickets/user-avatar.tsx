import { getUser } from "@/lib/mock";
import { cn } from "@/lib/utils";

/**
 * Avatars carry a hue per person now. Eight people in one list are hard to
 * tell apart in greyscale, and an avatar is identity rather than status — so
 * this does not compete with the status and priority colours.
 */
const paletteById: Record<string, string> = {
  "u-1": "bg-[#2e2552] text-[#c3b1fb]",
  "u-2": "bg-[#43222a] text-[#f6a3b2]",
  "u-3": "bg-[#1b3527] text-[#8fd6ab]",
  "u-4": "bg-[#3d2a17] text-[#f0b378]",
  "u-5": "bg-[#16303f] text-[#8ecbec]",
  "u-6": "bg-[#3a3016] text-[#e4c473]",
  "u-7": "bg-[#272749] text-[#adadea]",
  "u-8": "bg-[#3b1f35] text-[#eaa3d6]",
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
