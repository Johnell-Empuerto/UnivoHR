const hrPolicyModel = require("../models/hrPolicy.model");

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

  return await hrPolicyModel.create({
    title: title.trim(),
    category: category.trim().toLowerCase(),
    content: content.trim(),
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

  return await hrPolicyModel.update(id, {
    title: title !== undefined ? title.trim() : existing.title,
    category: category !== undefined ? category.trim().toLowerCase() : existing.category,
    content: content !== undefined ? content.trim() : existing.content,
    updated_by: user.id,
  });
};

const setActive = async (id, is_active, user) => {
  const existing = await hrPolicyModel.getById(id);
  if (!existing) throw new Error("Policy not found");
  return await hrPolicyModel.setActive(id, is_active, user.id);
};

const remove = async (id, user) => {
  return await setActive(id, false, user);
};

const searchPolicies = async (question, category) => {
  const detectedCategory = category || isCategoryQuestion(question);
  return await hrPolicyModel.search(question, detectedCategory);
};

const answerPolicyQuestion = async (question, category) => {
  const detectedCategory = category || isCategoryQuestion(question);
  const policies = await hrPolicyModel.search(question, detectedCategory);

  if (!policies || policies.length === 0) {
    return {
      answer:
        "I could not find an official policy for that. Please contact HR for more information.",
      source: null,
    };
  }

  const policy = policies[0];

  return {
    answer: `**${policy.title}**\n\n${policy.content}\n\n_For more information, please contact HR._`,
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
};
