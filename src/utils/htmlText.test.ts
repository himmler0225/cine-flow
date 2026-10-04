import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decodeHtmlEntities, htmlToParagraphs } from "./htmlText.ts";

describe("htmlToParagraphs", () => {
  it("splits upstream description HTML into text paragraphs", () => {
    assert.deepEqual(htmlToParagraphs("<p>Một&nbsp;hai</p><p>Ba<br/>bốn</p>"), [
      "Một hai",
      "Ba",
      "bốn",
    ]);
  });

  it("drops markup and event handlers instead of rendering them", () => {
    assert.deepEqual(
      htmlToParagraphs('<p>Hi<img src=x onerror="alert(1)"></p><script>x()</script>'),
      ["Hi"],
    );
  });

  it("keeps escaped tags as plain text", () => {
    assert.deepEqual(htmlToParagraphs("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>"), [
      "<script>alert(1)</script>",
    ]);
  });

  it("handles empty input", () => {
    assert.deepEqual(htmlToParagraphs(undefined), []);

    assert.deepEqual(htmlToParagraphs("<p> </p>"), []);
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes named and numeric entities, leaves unknown ones", () => {
    assert.equal(decodeHtmlEntities("&quot;A&quot; &#39;b&#x27; &foo;"), "\"A\" 'b' &foo;");
  });
});
