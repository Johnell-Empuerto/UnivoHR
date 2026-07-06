jest.mock("../models/calendar.model", () => ({
  getCalendar: jest.fn(),
  getByDate: jest.fn(),
  getById: jest.fn(),
  getByDateAndBranch: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

const calendarModel = require("../models/calendar.model");
const {
  getCalendar, getByDate, getById, create, update, remove,
} = require("../services/calendar.service");

describe("calendar.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCalendar", () => {
    it("delegates", async () => {
      calendarModel.getCalendar.mockResolvedValue([{ date: "2026-07-06" }]);
      expect(await getCalendar("2026-01-01", "2026-12-31")).toEqual([{ date: "2026-07-06" }]);
    });
  });

  describe("getByDate", () => {
    it("delegates", async () => {
      calendarModel.getByDate.mockResolvedValue(null);
      expect(await getByDate("2026-07-06")).toBeNull();
    });
  });

  describe("getById", () => {
    it("delegates", async () => {
      calendarModel.getById.mockResolvedValue({ id: 1 });
      expect(await getById(1)).toEqual({ id: 1 });
    });
  });

  describe("create", () => {
    it("creates with valid data", async () => {
      calendarModel.getByDateAndBranch.mockResolvedValue(null);
      calendarModel.create.mockResolvedValue({ id: 1, date: "2026-07-06", day_type: "REGULAR_HOLIDAY" });

      const result = await create({ date: "2026-07-06", day_type: "REGULAR_HOLIDAY" });
      expect(result.id).toBe(1);
    });

    it("throws when date missing", async () => {
      await expect(create({ day_type: "REGULAR" })).rejects.toThrow("Date is required");
    });

    it("throws for invalid day_type", async () => {
      await expect(create({ date: "2026-07-06", day_type: "INVALID" })).rejects.toThrow("Invalid day_type");
    });

    it("throws when record already exists for date+branch", async () => {
      calendarModel.getByDateAndBranch.mockResolvedValue({ id: 2 });
      await expect(create({ date: "2026-07-06", day_type: "REGULAR_HOLIDAY" })).rejects.toThrow("Record already exists");
    });
  });

  describe("update", () => {
    it("updates with valid data", async () => {
      calendarModel.update.mockResolvedValue({ id: 1, day_type: "SPECIAL_HOLIDAY" });
      const result = await update(1, { day_type: "SPECIAL_HOLIDAY" });
      expect(result.day_type).toBe("SPECIAL_HOLIDAY");
    });

    it("throws for invalid day_type on update", async () => {
      await expect(update(1, { day_type: "BAD" })).rejects.toThrow("Invalid day_type");
    });
  });

  describe("remove", () => {
    it("delegates", async () => {
      calendarModel.remove.mockResolvedValue({ id: 1 });
      expect(await remove(1)).toEqual({ id: 1 });
    });
  });
});
