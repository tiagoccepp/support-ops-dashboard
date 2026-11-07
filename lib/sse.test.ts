import { describe, expect, it } from "vitest";
import { feedSse } from "./sse";

describe("feedSse", () => {
  it("parses complete frames and swallows [DONE]", () => {
    const { events, rest } = feedSse("", 'data: {"a":1}\n\ndata: [DONE]\n\n');
    expect(events).toEqual(['{"a":1}']);
    expect(rest).toBe("");
  });

  it("holds partial frames across chunks", () => {
    const first = feedSse("", 'data: {"a":');
    expect(first.events).toEqual([]);
    const second = feedSse(first.rest, '1}\n\ndata: {"b":2}\n\n');
    expect(second.events).toEqual(['{"a":1}', '{"b":2}']);
    expect(second.rest).toBe("");
  });

  it("ignores comment and empty frames", () => {
    const { events } = feedSse("", ": ping\n\n\n\ndata: x\n\n");
    expect(events).toEqual(["x"]);
  });
});
