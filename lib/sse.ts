/** Incremental Server-Sent Events parser for the agent /chat/stream endpoint.
 * Feed raw text chunks; completed `data:` payloads come out, the partial
 * tail stays in `rest` for the next chunk. `[DONE]` frames are swallowed.
 */

export interface SseFeed {
  events: string[];
  rest: string;
}

export function feedSse(rest: string, chunk: string): SseFeed {
  const buffer = rest + chunk;
  const events: string[] = [];
  const frames = buffer.split("\n\n");
  const tail = frames.pop() ?? "";
  for (const frame of frames) {
    const dataLines: string[] = [];
    for (const line of frame.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:")) dataLines.push(trimmed.slice(5).trim());
    }
    if (dataLines.length === 0) continue;
    const payload = dataLines.join("\n");
    if (payload === "[DONE]") continue;
    events.push(payload);
  }
  return { events, rest: tail };
}
