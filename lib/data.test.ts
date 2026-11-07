import { describe, expect, it } from "vitest";
import {
  AGENT_SAMPLES,
  RAG_SAMPLES,
  confidencePct,
  liveBasesFromEnv,
  shortSource,
  sourceOf,
  targetsFor,
} from "./data";

describe("liveBasesFromEnv", () => {
  it("picks trimmed bases and drops empties", () => {
    const bases = liveBasesFromEnv({
      NEXT_PUBLIC_API_RAG: "https://rag.example.com/",
      NEXT_PUBLIC_API_AGENT: "  ",
      NEXT_PUBLIC_API_TICKETS: undefined,
    });
    expect(bases).toEqual({ rag: "https://rag.example.com", agent: undefined, tickets: undefined });
  });
});

describe("targetsFor", () => {
  it("prefers live base, falls back to fixture", () => {
    expect(targetsFor({ rag: "https://r.test" }, "rag", "/query", "q_pricing.json")).toEqual([
      "https://r.test/query",
      "/data/rag/q_pricing.json",
    ]);
  });

  it("fixture-only when no live base", () => {
    expect(targetsFor({}, "tickets", "/tickets/submit", "submit_billing.json")).toEqual([
      "/data/tickets/submit_billing.json",
    ]);
  });

  it("supports a relative fixture base for basePath-proof fetches", () => {
    expect(targetsFor({ rag: "https://r.test" }, "rag", "/query", "q_pricing.json", "data")).toEqual([
      "https://r.test/query",
      "data/rag/q_pricing.json",
    ]);
  });
});

describe("sourceOf", () => {
  it("classifies live vs fixture urls", () => {
    const bases = { rag: "https://r.test" };
    expect(sourceOf("https://r.test/query", bases, "rag")).toBe("live");
    expect(sourceOf("data/rag/q_pricing.json", bases, "rag")).toBe("fixture");
    expect(sourceOf("/data/rag/q_pricing.json", {}, "rag")).toBe("fixture");
  });
});

describe("samples", () => {
  it("rag and agent keep 4 recorded fixtures each", () => {
    expect(RAG_SAMPLES).toHaveLength(4);
    expect(AGENT_SAMPLES).toHaveLength(4);
    for (const s of [...RAG_SAMPLES, ...AGENT_SAMPLES]) expect(s.fixture.endsWith(".json")).toBe(true);
  });
});

describe("formatters", () => {
  it("shortens sources to basename", () => {
    expect(shortSource("/a/b/policy.md")).toBe("policy.md");
    expect(shortSource("policy.md")).toBe("policy.md");
  });

  it("formats confidence as pct", () => {
    expect(confidencePct(0.99)).toBe("99%");
    expect(confidencePct(0.3)).toBe("30%");
  });
});
