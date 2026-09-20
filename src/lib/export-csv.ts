import {
  getLabel,
  getProject,
  getUser,
  STATUS_LABEL,
  PRIORITY_LABEL,
  TYPE_LABEL,
  type Ticket,
} from "@/lib/mock";

/**
 * RFC 4180 quoting. Not optional: ticket titles contain commas constantly, and
 * a stray quote in one would otherwise shift every column after it.
 */
function cell(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const COLUMNS = [
  "Key",
  "Title",
  "Project",
  "Type",
  "Status",
  "Priority",
  "Severity",
  "Assignees",
  "Reporter",
  "Labels",
  "Due",
  "Created",
  "Updated",
] as const;

export function ticketsToCsv(tickets: Ticket[]) {
  const rows = tickets.map((ticket) =>
    [
      ticket.key,
      ticket.title,
      getProject(ticket.projectId)?.name ?? "",
      TYPE_LABEL[ticket.type],
      STATUS_LABEL[ticket.status],
      PRIORITY_LABEL[ticket.priority],
      ticket.severity ?? "",
      ticket.assigneeIds.map((id) => getUser(id)?.name ?? id).join("; "),
      getUser(ticket.reporterId)?.name ?? "",
      ticket.labelIds.map((id) => getLabel(id)?.name ?? id).join("; "),
      ticket.dueAt ? ticket.dueAt.slice(0, 10) : "",
      ticket.createdAt.slice(0, 10),
      ticket.updatedAt.slice(0, 10),
    ]
      .map(cell)
      .join(","),
  );

  // CRLF, because Excel treats a bare LF as one long line.
  return [COLUMNS.join(","), ...rows].join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  // The BOM is what makes Excel read it as UTF-8; without it every accented
  // name in the file comes out mangled.
  const blob = new Blob([`﻿${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
