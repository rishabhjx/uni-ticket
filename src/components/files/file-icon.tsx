import {
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
  Folder,
  Presentation,
  type LucideIcon,
} from "lucide-react";

import type { DriveFileKind } from "@/lib/mock";

export const FILE_KIND_ICON: Record<DriveFileKind, LucideIcon> = {
  folder: Folder,
  doc: FileText,
  sheet: FileSpreadsheet,
  slide: Presentation,
  pdf: FileType,
  image: FileImage,
  video: FileVideo,
  other: File,
};
