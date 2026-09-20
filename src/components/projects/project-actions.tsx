"use client";

import { Download } from "lucide-react";

import { CallButton } from "@/components/shared/call-button";
import { downloadCsv, ticketsToCsv } from "@/lib/export-csv";
import type { Project, Ticket } from "@/lib/mock";

/**
 * The actions that belong to a project rather than to a view. They ride in the
 * filter bar because that is the row already sitting above the content, and a
 * third bar to hold two buttons is a third bar.
 */
export function ProjectActions({
  project,
  tickets,
}: {
  project: Project;
  /** What is on screen: exporting should give you what you filtered to. */
  tickets: Ticket[];
}) {
  return (
    <>
      <CallButton
        subject={project.name}
        participantIds={project.memberIds}
      />
      <button
        type="button"
        onClick={() =>
          downloadCsv(
            `${project.key.toLowerCase()}-tickets.csv`,
            ticketsToCsv(tickets),
          )
        }
        aria-label="Export these tickets as CSV"
        title={`Export ${tickets.length} tickets as CSV`}
        className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
      >
        <Download className="size-4" strokeWidth={1.75} />
      </button>
    </>
  );
}
