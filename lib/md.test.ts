import { describe, expect, it } from "vitest";
import { escapeHtml, renderMiniMarkdown } from "./md";

describe("escapeHtml", () => {
  it("escapes markup chars", () => {
    expect(escapeHtml("<b>&hi</b>")).toBe("&lt;b&gt;&amp;hi&lt;/b&gt;");
  });
});

describe("renderMiniMarkdown", () => {
  it("renders bold and line breaks without raw HTML", () => {
    expect(renderMiniMarkdown("- Costs **USD 12** [2]\n- Next")).toBe(
      "- Costs <strong>USD 12</strong> [2]<br />- Next",
    );
  });

  it("neutralizes injected tags before bold parsing", () => {
    expect(renderMiniMarkdown("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });
});
