/** @param {unknown} s @returns {string} Escape text for HTML attribute and text node contexts. */
export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @param {string} href @param {string} label @param {string} [className] @returns {string} Outbound Fiverr CTA with noopener. */
export function fiverrLink(href, label, className) {
  const cls = className ? ` class="${className}"` : "";
  return `<a${cls} href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (opens in new tab)</span></a>`;
}
  return String(s ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @param {string} href @param {string} label @param {string} [className] @returns {string} Outbound Fiverr CTA with noopener. */
export function fiverrLink(href, label, className) {
  const cls = className ? ` class="${className}"` : "";
  return `<a${cls} href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (opens in new tab)</span></a>`;
}
