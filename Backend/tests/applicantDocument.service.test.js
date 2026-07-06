jest.mock("../models/applicantDocument.model", () => ({
  getByApplicantId: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("../models/applicant.model", () => ({
  getById: jest.fn(),
}));

const docModel = require("../models/applicantDocument.model");
const applicantModel = require("../models/applicant.model");
const {
  getByApplicantId,
  getById,
  create,
  remove,
} = require("../services/applicantDocument.service");

describe("applicantDocument.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByApplicantId", () => {
    it("returns documents for existing applicant", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      docModel.getByApplicantId.mockResolvedValue([{ id: 1, document_type: "Resume" }]);
      const result = await getByApplicantId(1);
      expect(result).toHaveLength(1);
      expect(result[0].document_type).toBe("Resume");
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(getByApplicantId(999)).rejects.toThrow("Applicant not found");
    });
  });

  describe("getById", () => {
    it("returns document when found", async () => {
      docModel.getById.mockResolvedValue({ id: 1, file_url: "http://example.com/doc.pdf" });
      const result = await getById(1);
      expect(result.file_url).toBe("http://example.com/doc.pdf");
    });

    it("throws when document not found", async () => {
      docModel.getById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Document not found");
    });
  });

  describe("create", () => {
    it("creates document with valid data", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      docModel.create.mockResolvedValue({ id: 1, applicant_id: 1, document_type: "Resume", file_url: "http://example.com/doc.pdf" });
      const result = await create({ applicant_id: 1, document_type: "Resume", file_url: "http://example.com/doc.pdf" });
      expect(result.id).toBe(1);
    });

    it("throws when applicant_id missing", async () => {
      await expect(create({ document_type: "Resume", file_url: "x" })).rejects.toThrow("Applicant ID is required");
    });

    it("throws when document_type missing", async () => {
      await expect(create({ applicant_id: 1, file_url: "x" })).rejects.toThrow("Document type is required");
    });

    it("throws when file_url missing", async () => {
      await expect(create({ applicant_id: 1, document_type: "Resume" })).rejects.toThrow("File URL is required");
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(create({ applicant_id: 999, document_type: "Resume", file_url: "x" })).rejects.toThrow("Applicant not found");
    });
  });

  describe("remove", () => {
    it("removes existing document", async () => {
      docModel.getById.mockResolvedValue({ id: 1 });
      docModel.remove.mockResolvedValue({ id: 1 });
      await expect(remove(1)).resolves.toBeDefined();
    });

    it("throws when document not found", async () => {
      docModel.getById.mockResolvedValue(null);
      await expect(remove(999)).rejects.toThrow("Document not found");
    });
  });
});
