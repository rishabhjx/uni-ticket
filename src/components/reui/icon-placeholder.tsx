import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftToLine,
  ArrowRight,
  ArrowRightToLine,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CornerUpLeft,
  CornerUpRight,
  Loader2,
  PinOff,
  Plus,
  Settings2,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * ReUI's components reference icons through a placeholder so the registry can
 * emit whichever icon set you picked. This project uses lucide, so the shim
 * resolves the lucide name and drops the other sets.
 */
const icons: Record<string, LucideIcon> = {
  ArrowDownIcon: ArrowDown,
  ArrowLeftIcon: ArrowLeft,
  ArrowLeftToLineIcon: ArrowLeftToLine,
  ArrowRightIcon: ArrowRight,
  ArrowRightToLineIcon: ArrowRightToLine,
  ArrowUpIcon: ArrowUp,
  CheckIcon: Check,
  ChevronDownIcon: ChevronDown,
  ChevronLeftIcon: ChevronLeft,
  ChevronRightIcon: ChevronRight,
  ChevronsUpDownIcon: ChevronsUpDown,
  CornerUpLeftIcon: CornerUpLeft,
  CornerUpRightIcon: CornerUpRight,
  Loader2Icon: Loader2,
  PinOffIcon: PinOff,
  PlusIcon: Plus,
  Settings2Icon: Settings2,
  XIcon: X,
};

export function IconPlaceholder({
  lucide,
  className,
  ...props
}: {
  lucide: string;
  /** Accepted and ignored — other icon sets are not installed. */
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
  className?: string;
} & React.SVGProps<SVGSVGElement>) {
  const Icon = icons[lucide] ?? ChevronRight;
  return <Icon className={className} {...props} />;
}
