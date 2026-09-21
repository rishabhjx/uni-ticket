"use client";

import * as React from "react";

import { Download, Loader2 } from "lucide-react";

import { AddFieldPopover } from "@/components/projects/add-field-popover";
import { CallButton } from "@/components/shared/call-button";
import { useCelebrate } from "@/components/shared/celebrate";
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
  const celebrate = useCelebrate();
  const [exporting, setExporting] = React.useState(false);

  /*
   * A CSV of a few hundred rows is built and handed to the browser in one
   * frame, and a download that starts silently in a background tab looks
   * exactly like a click that did nothing. The button says it is working and
   * then says what it produced.
   */
  const exportCsv = React.useCallback(() => {
    setExporting(true);
    const name = `${project.key.toLowerCase()}-tickets.csv`;
    // A frame's gap so the spinner paints before the main thread is taken.
    requestAnimationFrame(() => {
      downloadCsv(name, ticketsToCsv(tickets));
      setExporting(false);
      celebrate("⬇", `${tickets.length} tickets exported to ${name}`);
    });
  }, [celebrate, project.key, tickets]);

  return (
    <>
      <CallButton
        subject={project.name}
        participantIds={project.memberIds}
      />
      <AddFieldPopover project={project} />
      <button
        type="button"
        onClick={exportCsv}
        disabled={exporting || tickets.length === 0}
        aria-label="Export these tickets as CSV"
        aria-busy={exporting}
        title={
          tickets.length === 0
            ? "Nothing to export"
            : `Export ${tickets.length} tickets as CSV`
        }
        className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900 disabled:pointer-events-none disabled:text-grey-400"
      >
        {exporting ? (
          <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
        ) : (
          <Download className="size-4" strokeWidth={1.75} />
        )}
      </button>
    </>
  );
}
