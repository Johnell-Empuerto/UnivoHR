const sanitizeHtml = require("sanitize-html");

const RICH_TEXT_OPTIONS = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "h1", "h2", "h3", "h4",
    "ul", "ol", "li", "blockquote", "a", "span", "div",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    span: ["style"],
    div: ["style"],
    p: ["style"],
  },
  allowedSchemes: ["http", "https"],
  disallowedTagsMode: "discard",
  allowedSchemesByTag: { a: ["http", "https", "mailto"] },
  enforceHtmlBoundary: true,
};

const cleanPlainText = (value) => {
  if (value == null || typeof value !== "string") return "";
  return value
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ");
};

const cleanOptionalPlainText = (value) => {
  const cleaned = cleanPlainText(value);
  return cleaned || null;
};

const cleanRichText = (value) => {
  if (value == null || typeof value !== "string") return "";
  return sanitizeHtml(value.trim(), RICH_TEXT_OPTIONS);
};

const normalizeString = (value) => {
  if (value == null || typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
};

module.exports = {
  cleanPlainText,
  cleanOptionalPlainText,
  cleanRichText,
  normalizeString,
};
