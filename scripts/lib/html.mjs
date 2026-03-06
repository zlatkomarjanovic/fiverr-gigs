/** Escape text for HTML attribute and text node contexts. */
export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Outbound Fiverr CTA with noopener. */
export function fiverrLink(href, label, className) {
  const cls = className ? ` class="${className}"` : "";
  return `<a${cls} href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}
