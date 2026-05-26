const hrPolicyModel = require("../models/hrPolicy.model");
const sanitizeHtml = require("sanitize-html");

const SANITIZE_OPTIONS = {
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
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    th: ["style"],
    td: ["style"],
  },
  allowedStyles: {
    "*": {
      color: [/.*/],
      "background-color": [/.*/],
      "text-align": [/.*/],
      "font-weight": [/.*/],
      "font-style": [/.*/],
      "text-decoration": [/.*/],
      margin: [/.*/],
      padding: [/.*/],
    },
  },
  allowedSchemes: ["http", "https"],
  disallowedTagsMode: "discard",
  allowedSchemesByTag: { a: ["http", "https", "mailto"] },
  enforceHtmlBoundary: true,
};

const stripHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const isHtmlContent = (content) => /<[a-z][\s\S]*>/i.test(content);

const toPlainText = (content) => {
  if (isHtmlContent(content)) return stripHtml(content);
  return content;
};

const POLICY_CATEGORY_KEYWORDS = {
  leave: ["leave", "vacation", "sick leave", "sick", "vacation leave"],
  attendance: [
    "attendance",
    "clock in",
    "clock out",
    "check in",
    "check out",
    "late",
    "arrival",
    "punch",
  ],
  overtime: ["overtime", "ot", "extra work", "over time", "undertime"],
  security: [
    "security",
    "password",
    "login",
    "credential",
    "audit",
    "share my password",
    "share password",
  ],
  payroll: [
    "payroll",
    "salary",
    "payslip",
    "pay",
    "compensation",
    "payroll concern",
  ],
  privacy: [
    "privacy",
    "data privacy",
    "confidential",
    "data",
    "information",
    "private",
  ],
};

const isCategoryQuestion = (question) => {
  const q = question.toLowerCase();
  if (/\bcompany\s*policy\b/i.test(q) && !/\b(leave|attendance|overtime|security|payroll|privacy)\b/i.test(q)) {
    return "company";
  }
  for (const [category, keywords] of Object.entries(POLICY_CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (q.includes(keyword)) return category;
    }
  }
  return null;
};

const getAll = async (user) => {
  if (user.role === "ADMIN" || user.role === "HR_ADMIN") {
    return await hrPolicyModel.getAll({ includeInactive: true });
  }
  return await hrPolicyModel.getAll({ includeInactive: false });
};

const getById = async (id) => {
  const policy = await hrPolicyModel.getById(id);
  if (!policy) throw new Error("Policy not found");
  return policy;
};

const create = async (data, user) => {
  const { title, category, content } = data;
  if (!title || !title.trim()) throw new Error("Title is required");
  if (!category || !category.trim()) throw new Error("Category is required");
  if (!content || !content.trim()) throw new Error("Content is required");

  const sanitized = sanitizeHtml(content.trim(), SANITIZE_OPTIONS);
  const format = isHtmlContent(sanitized) ? "html" : "text";

  return await hrPolicyModel.create({
    title: title.trim(),
    category: category.trim().toLowerCase(),
    content: sanitized,
    content_format: format,
    created_by: user.id,
  });
};

const update = async (id, data, user) => {
  const existing = await hrPolicyModel.getById(id);
  if (!existing) throw new Error("Policy not found");

  const { title, category, content } = data;
  if (title !== undefined && !title.trim()) throw new Error("Title is required");
  if (category !== undefined && !category.trim()) throw new Error("Category is required");
  if (content !== undefined && !content.trim()) throw new Error("Content is required");

  let sanitized;
  let format;
  if (content !== undefined) {
    sanitized = sanitizeHtml(content.trim(), SANITIZE_OPTIONS);
    format = isHtmlContent(sanitized) ? "html" : "text";
  }

  return await hrPolicyModel.update(id, {
    title: title !== undefined ? title.trim() : existing.title,
    category: category !== undefined ? category.trim().toLowerCase() : existing.category,
    content: content !== undefined ? sanitized : existing.content,
    content_format: content !== undefined ? format : existing.content_format,
    updated_by: user.id,
  });
};

const setActive = async (id, is_active, user) => {
  const existing = await hrPolicyModel.getById(id);
  if (!existing) throw new Error("Policy not found");
  return await hrPolicyModel.setActive(id, is_active, user.id);
};

const remove = async (id, user) => {
  const existing = await hrPolicyModel.getById(id);
  if (!existing) throw new Error("Policy not found");
  return await hrPolicyModel.remove(id);
};

const isListRequest = (question) => {
  const q = question.toLowerCase();
  return (
    /\b(?:list|show|what\s+are|get|view|all)\b/i.test(q) &&
    /\b(?:policies|rules|guidelines|regulations)\b/i.test(q)
  );
};

const STOP_WORDS = new Set([
  "the", "this", "that", "what", "how", "why", "when", "where", "who", "which",
  "and", "are", "for", "not", "but", "has", "have", "had", "can", "will",
  "would", "could", "should", "its", "all", "any", "each", "every", "some",
  "about", "into", "over", "after", "before", "between", "with", "without",
  "from", "than", "then", "also", "very", "just", "does", "doesn", "do",
  "doesnt", "dont", "don", "is", "was", "were", "been", "being",
]);

const extractRelevantSection = (question, content) => {
  const q = question.toLowerCase().trim();
  const words = q
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  if (words.length === 0) return null;

  const plainContent = toPlainText(content);
  const sentences = plainContent.match(/[^.!?\n]+[.!?\n]*/g) || [plainContent];
  const cleanSentences = sentences.map((s) => s.trim()).filter(Boolean);

  if (cleanSentences.length <= 1) return null;

  let bestSentence = null;
  let bestScore = 0;

  for (const sentence of cleanSentences) {
    const s = sentence.toLowerCase();
    let score = 0;

    for (const word of words) {
      if (s.includes(word)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
    }
  }

  return bestScore > 0 ? bestSentence : null;
};

const searchPolicies = async (question, category) => {
  const detectedCategory = category || isCategoryQuestion(question);
  return await hrPolicyModel.search(question, detectedCategory);
};

const answerPolicyQuestion = async (question, category) => {
  const detectedCategory = category || isCategoryQuestion(question);
  const q = question.toLowerCase().trim();

  if (isListRequest(question) || (detectedCategory === "company" && q.split(/\s+/).length <= 4)) {
    const allPolicies = await hrPolicyModel.getAll({ includeInactive: false });
    if (allPolicies && allPolicies.length > 0) {
      const listItems = allPolicies
        .map((p) => `- **${p.title}** (${p.category}): ${toPlainText(p.content).split(/[.\n]/)[0]}.`)
        .join("\n");
      return {
        answer: `Here are the available company policies:\n\n${listItems}\n\n_Ask me for details on any specific policy (e.g., "What is the leave policy?")!_`,
        source: "Company Policies",
        metadata: { category: "company", isList: true },
      };
    }
  }

  const policies = await hrPolicyModel.search(question, detectedCategory);

  if (!policies || policies.length === 0) {
    return {
      answer:
        "I could not find an official policy for that. Please contact HR for more information.",
      source: null,
    };
  }

  const policy = policies[0];

  const wantsFull =
    /\b(full|complete|entire|whole|detail|detailed)\b/i.test(question) &&
    !/\b(not|no|don't|dont)\b/i.test(question);

  const plainContent = toPlainText(policy.content);

  if (wantsFull) {
    return {
      answer: `**${policy.title}**\n\n${plainContent}\n\n_For more information, please contact HR._`,
      source: policy.title,
      metadata: { policyId: policy.id, category: policy.category },
    };
  }

  const relevantSection = extractRelevantSection(question, policy.content);

  if (relevantSection) {
    return {
      answer: `Based on company policy:\n\n${relevantSection}\n\nFor more detailed or special cases, please contact HR.\n\nSource: ${policy.title}`,
      source: policy.title,
      metadata: { policyId: policy.id, category: policy.category },
    };
  }

  return {
    answer: `Based on company policy:\n\n${plainContent}\n\nFor more detailed or special cases, please contact HR.\n\nSource: ${policy.title}`,
    source: policy.title,
    metadata: { policyId: policy.id, category: policy.category },
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  setActive,
  remove,
  searchPolicies,
  answerPolicyQuestion,
  isCategoryQuestion,
  isListRequest,
  extractRelevantSection,
};
