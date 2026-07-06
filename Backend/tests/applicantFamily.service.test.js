jest.mock("../models/applicantFamily.model", () => ({
  getAllByApplicantId: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("../models/applicant.model", () => ({ getById: jest.fn() }));

const model = require("../models/applicantFamily.model");
const applicantModel = require("../models/applicant.model");
const { getByApplicantId, create, update, remove } = require("../services/applicantFamily.service");

describe("applicantFamily.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("getByApplicantId", () => {
    it("returns family members for applicant", async () => {
      model.getAllByApplicantId.mockResolvedValue([{ id: 1 }]);
      expect(await getByApplicantId(1)).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("creates for existing applicant", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      model.create.mockResolvedValue({ id: 1 });
      expect(await create({ applicant_id: 1, full_name: "Jane" })).toBeDefined();
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(create({ applicant_id: 999 })).rejects.toThrow("Applicant not found");
    });
  });

  describe("update", () => {
    it("updates existing record", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      model.update.mockResolvedValue({ id: 1 });
      await expect(update(1, { full_name: "Updated" })).resolves.toBeDefined();
    });

    it("throws when not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(update(999, {})).rejects.toThrow("Family member not found");
    });
  });

  describe("remove", () => {
    it("removes existing record", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      await expect(remove(1)).resolves.toBeUndefined();
    });

    it("throws when not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(remove(999)).rejects.toThrow("Family member not found");
    });
  });
});
