/**
 * Side-by-side columns for events that overlap in time, the way every
 * time-grid calendar draws a double-booked hour. Events are grouped into
 * clusters of mutual (possibly transitive) overlap first, and every event in
 * a cluster shares that cluster's column count — the width stays constant
 * for the whole run rather than renegotiating every time one event ends,
 * which is what Google Calendar's own grid does.
 */
export function layoutOverlaps<T extends { id: string; start: number; end: number }>(
  events: T[],
): Map<string, { column: number; columns: number }> {
  const sorted = [...events].sort((a, b) => a.start - b.start || a.end - b.end);
  const result = new Map<string, { column: number; columns: number }>();

  let cluster: T[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;
    const columnEnds: number[] = [];
    const columnOf = new Map<string, number>();
    for (const event of cluster) {
      let placed = -1;
      for (let index = 0; index < columnEnds.length; index += 1) {
        if (columnEnds[index] <= event.start) {
          columnEnds[index] = event.end;
          placed = index;
          break;
        }
      }
      if (placed === -1) {
        columnEnds.push(event.end);
        placed = columnEnds.length - 1;
      }
      columnOf.set(event.id, placed);
    }
    const columns = columnEnds.length;
    for (const event of cluster) {
      result.set(event.id, { column: columnOf.get(event.id) ?? 0, columns });
    }
    cluster = [];
  };

  for (const event of sorted) {
    if (cluster.length > 0 && event.start >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    cluster.push(event);
    clusterEnd = Math.max(clusterEnd, event.end);
  }
  flush();

  return result;
}
