/** Minimal markdown for recorded RAG answers: escape HTML, **bold**, line breaks.
 * Fixtures contain `**...**` and newlines only — no links, no lists to parse.
 */

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

export function escapeHtml(raw: string): string {
  return raw.replace(/[&<>]/g, (ch) => ESCAPES[ch] ?? ch);
}

export function renderMiniMarkdown(raw: string): string {
  const safe = escapeHtml(raw);
  const bold = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return bold.replace(/\n/g, "<br />");
}
