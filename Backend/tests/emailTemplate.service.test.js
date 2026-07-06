jest.mock("../models/emailTemplate.model", () => ({
  getAllTemplates: jest.fn(),
  getTemplateByType: jest.fn(),
  getActiveTemplateByType: jest.fn(),
  upsertTemplate: jest.fn(),
  updateTemplate: jest.fn(),
  toggleTemplate: jest.fn(),
  deleteTemplate: jest.fn(),
}));

jest.mock("../services/emailWrapper.service", () => ({
  wrapEmailWithDesign: jest.fn().mockResolvedValue("<html>wrapped</html>"),
}));

jest.mock("../utils/inputSanitizer", () => ({
  cleanPlainText: jest.fn(s => s),
  cleanRichText: jest.fn(s => s),
}));

jest.mock("../utils/logger", () => ({ info: jest.fn() }));

const emailTemplateModel = require("../models/emailTemplate.model");
const { wrapEmailWithDesign } = require("../services/emailWrapper.service");
const {
  getAllTemplates, getTemplateByType, getActiveTemplateByType,
  upsertTemplate, updateTemplate, toggleTemplate, deleteTemplate,
  applyTemplate, renderEmail,
} = require("../services/emailTemplate.service");

describe("emailTemplate.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("applyTemplate", () => {
    it("replaces {{variables}} with values", () => {
      const html = "<p>Hello {{name}}, your OTP is {{otp}}</p>";
      const result = applyTemplate(html, { name: "John", otp: "123456" });
      expect(result).toBe("<p>Hello John, your OTP is 123456</p>");
    });

    it("leaves unknown variables unreplaced", () => {
      const result = applyTemplate("<p>{{name}}</p>", {});
      expect(result).toBe("<p>{{name}}</p>");
    });

    it("handles html with no template variables", () => {
      const result = applyTemplate("<p>Static</p>", { name: "John" });
      expect(result).toBe("<p>Static</p>");
    });
  });

  describe("getAllTemplates", () => {
    it("delegates", async () => {
      emailTemplateModel.getAllTemplates.mockResolvedValue([]);
      expect(await getAllTemplates()).toEqual([]);
    });
  });

  describe("getTemplateByType", () => {
    it("delegates", async () => {
      emailTemplateModel.getTemplateByType.mockResolvedValue({ type: "WELCOME" });
      expect(await getTemplateByType("WELCOME")).toEqual({ type: "WELCOME" });
    });
  });

  describe("getActiveTemplateByType", () => {
    it("delegates", async () => {
      emailTemplateModel.getActiveTemplateByType.mockResolvedValue({ type: "WELCOME" });
      expect(await getActiveTemplateByType("WELCOME")).toEqual({ type: "WELCOME" });
    });
  });

  describe("upsertTemplate", () => {
    it("creates with valid data", async () => {
      emailTemplateModel.upsertTemplate.mockResolvedValue({ id: 1 });
      const result = await upsertTemplate("WELCOME", "Subject", "<p>Body</p>", 1);
      expect(result).toEqual({ id: 1 });
    });

    it("throws when fields missing", async () => {
      await expect(upsertTemplate("", "Subject", "<p>Body</p>", 1)).rejects.toThrow("required");
    });
  });

  describe("updateTemplate / toggleTemplate / deleteTemplate", () => {
    it("update delegates", async () => {
      emailTemplateModel.updateTemplate.mockResolvedValue({ id: 1 });
      expect(await updateTemplate(1, "Sub", "<p>B</p>", true, 1)).toEqual({ id: 1 });
    });

    it("toggle delegates", async () => {
      emailTemplateModel.toggleTemplate.mockResolvedValue({ id: 1, is_active: false });
      expect(await toggleTemplate(1, false, 1)).toEqual({ id: 1, is_active: false });
    });

    it("delete delegates", async () => {
      emailTemplateModel.deleteTemplate.mockResolvedValue({ id: 1 });
      expect(await deleteTemplate(1)).toEqual({ id: 1 });
    });
  });

  describe("renderEmail", () => {
    it("renders and wraps template", async () => {
      emailTemplateModel.getActiveTemplateByType.mockResolvedValue({
        subject: "Hello {{name}}",
        body_html: "<p>Welcome {{name}}</p>",
      });

      const result = await renderEmail("WELCOME", { name: "John" });

      expect(result.subject).toBe("Hello John");
      expect(wrapEmailWithDesign).toHaveBeenCalledWith("<p>Welcome John</p>", "Hello John");
      expect(result.html).toBe("<html>wrapped</html>");
    });

    it("throws when no active template found", async () => {
      emailTemplateModel.getActiveTemplateByType.mockResolvedValue(null);
      await expect(renderEmail("NONEXISTENT", {})).rejects.toThrow("No active template found");
    });
  });
});
