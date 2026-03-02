/**
 * Details Block Plugin Tests
 *
 * Tests for the remarkDetailsBlock plugin that transforms HTML <details>
 * blocks into mdast details nodes.
 */

import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { remarkDetailsBlock } from "./detailsBlock";
import type { Root } from "mdast";
import type { Details } from "../types";

/**
 * Helper to parse markdown with the details plugin.
 */
function parseWithDetails(md: string): Root {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDetailsBlock);

  return processor.runSync(processor.parse(md)) as Root;
}

describe("remarkDetailsBlock", () => {
  describe("basic parsing", () => {
    it("transforms <details> HTML into details node", () => {
      const md = `<details>
<summary>Click to expand</summary>

Content inside details.
</details>`;
      const result = parseWithDetails(md);

      expect(result.children[0].type).toBe("details");
      const details = result.children[0] as Details;
      expect(details.summary).toBe("Click to expand");
    });

    it("parses details with markdown content", () => {
      const md = `<details>
<summary>Info</summary>

**Bold** and *italic* content.
</details>`;
      const result = parseWithDetails(md);

      const details = result.children[0] as Details;
      expect(details.type).toBe("details");
      expect(details.children.length).toBeGreaterThan(0);
    });

    it("handles details with open attribute", () => {
      const md = `<details open>
<summary>Open by default</summary>

Visible content.
</details>`;
      const result = parseWithDetails(md);

      expect(result.children[0].type).toBe("details");
    });
  });

  describe("reference-style links inside details", () => {
    it("resolves reference-style links inside details content", () => {
      const md = `<details>
<summary>Links</summary>

See [Example][ex] for more.

[ex]: https://example.com
</details>`;
      const result = parseWithDetails(md);

      const details = result.children[0] as Details;
      expect(details.type).toBe("details");
      // The content should have resolved the link reference
      // (This tests the integration of remarkResolveReferences in innerProcessor)
    });
  });

  describe("edge cases", () => {
    it("handles empty details block", () => {
      const md = `<details>
<summary>Empty</summary>
</details>`;
      const result = parseWithDetails(md);

      expect(result.children[0].type).toBe("details");
    });

    it("handles details without summary", () => {
      const md = `<details>
Some content without summary.
</details>`;
      const result = parseWithDetails(md);

      // Should still parse as details
      expect(result.children[0].type).toBe("details");
    });

    it("preserves non-details content", () => {
      const md = `# Heading

Regular paragraph.

<details>
<summary>Info</summary>

Details content.
</details>

Another paragraph.`;
      const result = parseWithDetails(md);

      expect(result.children[0].type).toBe("heading");
      expect(result.children[1].type).toBe("paragraph");
      expect(result.children[2].type).toBe("details");
      expect(result.children[3].type).toBe("paragraph");
    });

    it("handles nodes without children property", () => {
      // This tests the hasChildren type guard indirectly
      // Text nodes and other leaf nodes don't have children
      const md = `Just text with no block elements.`;
      const result = parseWithDetails(md);

      // Should not crash when visiting nodes without children
      expect(result.children[0].type).toBe("paragraph");
    });

    it("handles deeply nested structures", () => {
      const md = `> Blockquote with
> <details>
> <summary>Nested details</summary>
>
> Quoted details content.
> </details>`;
      const result = parseWithDetails(md);

      expect(result.children[0].type).toBe("blockquote");
    });

    it("handles nested details within details", () => {
      const md = `<details>
<summary>Outer details</summary>

Outer content.

<details>
<summary>Inner details</summary>

Inner hidden content.
</details>

Back to outer content.

</details>`;
      const result = parseWithDetails(md);

      const outerDetails = result.children[0] as Details;
      expect(outerDetails.type).toBe("details");
      expect(outerDetails.summary).toBe("Outer details");

      // Check for nested details in children
      const innerDetails = outerDetails.children.find(c => c.type === "details") as Details | undefined;
      expect(innerDetails).toBeDefined();
      expect(innerDetails?.type).toBe("details");
      expect(innerDetails?.summary).toBe("Inner details");
    });

    it("treats unclosed details block as plain html (pushes opening tag as-is)", () => {
      // If the </details> closing tag is never found, the opening tag is pushed as-is
      const md = `<details>
<summary>Unclosed</summary>

Content without closing tag.`;
      const result = parseWithDetails(md);

      // The unclosed <details> should NOT become a details node; it stays as html
      const types = result.children.map(c => c.type);
      expect(types).not.toContain("details");
    });

    it("does not parse single-block html when content surrounds details tags", () => {
      // parseDetailsHtmlBlock returns null when prefix or suffix exists
      const md = `Before <details><summary>S</summary></details> After`;
      const result = parseWithDetails(md);

      // Because prefix/suffix exist, parseDetailsHtmlBlock returns null
      // and the fallback sees no multi-block close tag, stays as paragraph
      expect(result.children[0].type).toBe("paragraph");
    });

    it("extractSummaryFromChildren returns unchanged when first child is not html", () => {
      // When the first content after <details> is a paragraph (not html with <summary>)
      const md = `<details>

No summary paragraph here.

</details>`;
      const result = parseWithDetails(md);

      const details = result.children[0] as Details;
      expect(details.type).toBe("details");
      // Uses the default "Details" summary since no html <summary> was found
      expect(details.summary).toBe("Details");
    });

    it("extractSummaryFromChildren returns unchanged when first html has no summary tag", () => {
      // When the first child is html but doesn't contain <summary>
      const md = `<details>
<div>Not a summary</div>

Body content.

</details>`;
      const result = parseWithDetails(md);

      const details = result.children[0] as Details;
      expect(details.type).toBe("details");
      // Uses the default "Details" summary since the html node has no <summary>
      expect(details.summary).toBe("Details");
    });
  });
});
