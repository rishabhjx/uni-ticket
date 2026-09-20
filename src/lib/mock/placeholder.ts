/**
 * Seeded attachments have no bytes behind them — there is no backend — so an
 * image attachment gets a generated placeholder rather than a broken preview.
 * Deterministic from the id, so the same attachment looks the same on every
 * render and across a reload.
 */
const HUES = [264, 303, 184, 162, 70, 22];

export function placeholderImage(id: string, label: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const hue = HUES[hash % HUES.length];
  const shade = 28 + (hash % 12);

  // An SVG data URL rather than a raster: it is a few hundred bytes, scales to
  // whatever the viewer needs, and needs no network.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${hue} 38% ${shade}%)"/>
    <stop offset="1" stop-color="hsl(${(hue + 40) % 360} 44% ${shade + 8}%)"/>
  </linearGradient></defs>
  <rect width="960" height="600" fill="url(#g)"/>
  <g fill="none" stroke="hsl(${hue} 30% ${shade + 26}%)" stroke-width="2" opacity="0.5">
    <rect x="64" y="64" width="832" height="472" rx="12"/>
    <line x1="64" y1="140" x2="896" y2="140"/>
    <circle cx="104" cy="102" r="8"/><circle cx="132" cy="102" r="8"/><circle cx="160" cy="102" r="8"/>
  </g>
  <text x="480" y="330" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="30" fill="hsl(${hue} 24% ${shade + 46}%)">${escapeXml(label)}</text>
  <text x="480" y="372" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="17" fill="hsl(${hue} 18% ${shade + 32}%)">Sample capture · no backend in this prototype</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
