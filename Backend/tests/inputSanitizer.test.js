const {
  cleanPlainText,
  cleanOptionalPlainText,
  cleanRichText,
  normalizeString,
} = require("../utils/inputSanitizer");

describe("cleanPlainText", () => {
  test("trims whitespace", () => {
    expect(cleanPlainText("  hello  ")).toBe("hello");
  });

  test("removes HTML tags, keeps text content", () => {
    expect(cleanPlainText("<script>alert('xss')</script>hello")).toBe(
      "alert('xss')hello",
    );
  });

  test("strips nested HTML tags", () => {
    expect(cleanPlainText("<p><b>bold</b> text</p>")).toBe("bold text");
  });

  test("normalizes multiple spaces", () => {
    expect(cleanPlainText("hello    world")).toBe("hello world");
  });

  test("handles null input", () => {
    expect(cleanPlainText(null)).toBe("");
  });

  test("handles undefined input", () => {
    expect(cleanPlainText(undefined)).toBe("");
  });

  test("handles non-string input", () => {
    expect(cleanPlainText(123)).toBe("");
  });

  test("decodes common HTML entities", () => {
    expect(cleanPlainText("hello &amp; world &lt;3")).toBe("hello & world <3");
  });

  test("returns empty string for empty input", () => {
    expect(cleanPlainText("")).toBe("");
  });
});

describe("cleanOptionalPlainText", () => {
  test("returns null for empty input", () => {
    expect(cleanOptionalPlainText("")).toBeNull();
  });

  test("returns null for whitespace-only input", () => {
    expect(cleanOptionalPlainText("   ")).toBeNull();
  });

  test("returns cleaned text for non-empty input", () => {
    expect(cleanOptionalPlainText("  hello  ")).toBe("hello");
  });

  test("returns null for null input", () => {
    expect(cleanOptionalPlainText(null)).toBeNull();
  });
});

describe("cleanRichText", () => {
  test("preserves allowed HTML tags", () => {
    const result = cleanRichText("<p>Hello <strong>world</strong></p>");
    expect(result).toBe("<p>Hello <strong>world</strong></p>");
  });

  test("strips dangerous tags", () => {
    const result = cleanRichText("<script>alert('xss')</script><p>safe</p>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>safe</p>");
  });

  test("strips event handlers", () => {
    const result = cleanRichText('<img src=x onerror=alert(1)>');
    expect(result).not.toContain("onerror");
  });

  test("allows <a> tags with href", () => {
    const result = cleanRichText('<a href="https://example.com">link</a>');
    expect(result).toContain("<a");
  });

  test("strips <a> tags with javascript: href", () => {
    const result = cleanRichText('<a href="javascript:alert(1)">link</a>');
    expect(result.toLowerCase()).not.toContain("javascript");
  });

  test("handles null input", () => {
    expect(cleanRichText(null)).toBe("");
  });

  test("handles non-string input", () => {
    expect(cleanRichText(123)).toBe("");
  });

  test("preserves table tags", () => {
    const html = "<table><tr><td>cell</td></tr></table>";
    const result = cleanRichText(html);
    expect(result).toContain("<table>");
    expect(result).toContain("<td>");
  });
});

describe("normalizeString", () => {
  test("trims whitespace", () => {
    expect(normalizeString("  hello  ")).toBe("hello");
  });

  test("collapses internal whitespace", () => {
    expect(normalizeString("hello    world")).toBe("hello world");
  });

  test("handles null input", () => {
    expect(normalizeString(null)).toBe("");
  });

  test("handles non-string input", () => {
    expect(normalizeString(undefined)).toBe("");
  });
});
