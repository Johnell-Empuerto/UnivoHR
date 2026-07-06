jest.mock("../models/hrPolicy.model", () => ({
  getAll: jest.fn(),
  getAllPaginated: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  setActive: jest.fn(),
  remove: jest.fn(),
  search: jest.fn(),
}));
jest.mock("../services/permission.service", () => ({ hasPermission: jest.fn() }));
jest.mock("sanitize-html", () => jest.fn((html) => html));
jest.mock("../utils/inputSanitizer", () => ({ cleanPlainText: jest.fn((t) => t) }));

const hrPolicyModel = require("../models/hrPolicy.model");
const { hasPermission } = require("../services/permission.service");
const {
  getAll, getAllPaginated, getById, create, update, setActive, remove,
  searchPolicies, answerPolicyQuestion,
  isCategoryQuestion, isListRequest, extractRelevantSection,
} = require("../services/hrPolicy.service");

describe("hrPolicy.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isCategoryQuestion", () => {
    it("returns 'leave' for leave-related questions", () => {
      expect(isCategoryQuestion("What is the leave policy?")).toBe("leave");
    });

    it("returns 'attendance' for attendance-related questions", () => {
      expect(isCategoryQuestion("How do I clock in?")).toBe("attendance");
    });

    it("returns 'company' for general policy questions", () => {
      expect(isCategoryQuestion("What is the company policy?")).toBe("company");
    });

    it("returns null for unrelated questions", () => {
      expect(isCategoryQuestion("What is for lunch?")).toBeNull();
    });
  });

  describe("isListRequest", () => {
    it("returns true for list requests", () => {
      expect(isListRequest("List all policies")).toBe(true);
    });

    it("returns true for 'what are' requests", () => {
      expect(isListRequest("What are the company policies?")).toBe(true);
    });

    it("returns false for specific questions", () => {
      expect(isListRequest("What is the leave policy?")).toBe(false);
    });
  });

  describe("extractRelevantSection", () => {
    it("returns matching sentence from content", () => {
      const content = "Employees must clock in before 9 AM. Late arrivals are tracked. Overtime requires approval.";
      const result = extractRelevantSection("What about overtime?", content);
      expect(result).toContain("Overtime");
    });

    it("returns null when content has single sentence", () => {
      expect(extractRelevantSection("question", "Single sentence.")).toBeNull();
    });

    it("returns null for stop-words-only questions", () => {
      expect(extractRelevantSection("the is this", "Some content here.")).toBeNull();
    });
  });

  describe("getAll", () => {
    it("returns active policies for users without manage permission", async () => {
      hasPermission.mockResolvedValue(false);
      hrPolicyModel.getAll.mockResolvedValue([{ id: 1, title: "Policy" }]);

      const result = await getAll({ id: 1 });
      expect(result).toHaveLength(1);
      expect(hrPolicyModel.getAll).toHaveBeenCalledWith({ includeInactive: false });
    });

    it("returns all policies for users with manage permission", async () => {
      hasPermission.mockResolvedValue(true);
      hrPolicyModel.getAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await getAll({ id: 1 });
      expect(result).toHaveLength(2);
      expect(hrPolicyModel.getAll).toHaveBeenCalledWith({ includeInactive: true });
    });
  });

  describe("getAllPaginated", () => {
    it("returns paginated policies", async () => {
      hasPermission.mockResolvedValue(false);
      hrPolicyModel.getAllPaginated.mockResolvedValue({ data: [{ id: 1 }], total: 1 });

      const result = await getAllPaginated({ id: 1 }, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getById", () => {
    it("returns policy by id", async () => {
      hrPolicyModel.getById.mockResolvedValue({ id: 1, title: "Policy" });
      const result = await getById(1);
      expect(result.title).toBe("Policy");
    });

    it("throws when not found", async () => {
      hrPolicyModel.getById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Policy not found");
    });
  });

  describe("create", () => {
    it("creates policy with sanitized content", async () => {
      hrPolicyModel.create.mockResolvedValue({ id: 1, title: "New Policy" });
      const result = await create(
        { title: "New Policy", category: "attendance", content: "<p>Content</p>" },
        { id: 1 },
      );
      expect(result.title).toBe("New Policy");
    });

    it("throws when required fields missing", async () => {
      await expect(create({ title: "", category: "attendance", content: "content" }, { id: 1 }))
        .rejects.toThrow("Title is required");
      await expect(create({ title: "T", category: "", content: "content" }, { id: 1 }))
        .rejects.toThrow("Category is required");
      await expect(create({ title: "T", category: "attendance", content: "" }, { id: 1 }))
        .rejects.toThrow("Content is required");
    });
  });

  describe("update", () => {
    it("updates existing policy", async () => {
      hrPolicyModel.getById.mockResolvedValue({ id: 1, title: "Old", category: "attendance", content: "Old" });
      hrPolicyModel.update.mockResolvedValue({ id: 1, title: "Updated" });

      const result = await update(1, { title: "Updated" }, { id: 1 });
      expect(result.title).toBe("Updated");
    });

    it("throws when policy not found", async () => {
      hrPolicyModel.getById.mockResolvedValue(null);
      await expect(update(999, { title: "X" }, { id: 1 })).rejects.toThrow("Policy not found");
    });
  });

  describe("setActive", () => {
    it("toggles active status", async () => {
      hrPolicyModel.getById.mockResolvedValue({ id: 1 });
      hrPolicyModel.setActive.mockResolvedValue({ id: 1, is_active: false });
      const result = await setActive(1, false, { id: 1 });
      expect(result.is_active).toBe(false);
    });
  });

  describe("remove", () => {
    it("removes existing policy", async () => {
      hrPolicyModel.getById.mockResolvedValue({ id: 1 });
      hrPolicyModel.remove.mockResolvedValue();
      await expect(remove(1, { id: 1 })).resolves.toBeUndefined();
    });
  });

  describe("searchPolicies", () => {
    it("searches policies by question and category", async () => {
      hrPolicyModel.search.mockResolvedValue([{ id: 1, title: "Leave Policy" }]);
      const result = await searchPolicies("leave policy", "leave");
      expect(result).toHaveLength(1);
    });
  });

  describe("answerPolicyQuestion", () => {
    it("returns list of policies for list requests", async () => {
      hrPolicyModel.getAll.mockResolvedValue([{ id: 1, title: "Leave Policy", category: "leave", content: "Take leave" }]);
      const result = await answerPolicyQuestion("List all policies");
      expect(result.answer).toContain("Leave Policy");
      expect(result.metadata.isList).toBe(true);
    });

    it("returns answer from policy search", async () => {
      hrPolicyModel.search.mockResolvedValue([{ id: 1, title: "Leave Policy", category: "leave", content: "Employees can take leave." }]);
      const result = await answerPolicyQuestion("leave policy");
      expect(result.answer).toContain("company policy");
      expect(result.source).toBe("Leave Policy");
    });

    it("returns not found message when no policy matches", async () => {
      hrPolicyModel.search.mockResolvedValue([]);
      const result = await answerPolicyQuestion("something obscure");
      expect(result.answer).toContain("could not find");
      expect(result.source).toBeNull();
    });
  });
});
