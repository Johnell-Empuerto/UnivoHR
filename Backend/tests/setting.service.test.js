jest.mock("../config/db", () => ({ query: jest.fn() }));

const pool = require("../config/db");
const {
  getSetting,
  getBoolSetting,
  getStringSetting,
  getNumberSetting,
  updateSetting,
  getAllSettings,
  toggleSetting,
} = require("../services/setting.service");

describe("setting.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSetting", () => {
    it("returns value when key exists", async () => {
      pool.query.mockResolvedValue({ rows: [{ value: "Asia/Manila" }] });
      const result = await getSetting("company_timezone");
      expect(result).toBe("Asia/Manila");
    });

    it("returns null when key not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await getSetting("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("getBoolSetting", () => {
    it("returns true for 'true' string", async () => {
      pool.query.mockResolvedValue({ rows: [{ value: "true" }] });
      expect(await getBoolSetting("key")).toBe(true);
    });

    it("returns false for 'false' string", async () => {
      pool.query.mockResolvedValue({ rows: [{ value: "false" }] });
      expect(await getBoolSetting("key")).toBe(false);
    });

    it("returns false for missing key", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await getBoolSetting("missing")).toBe(false);
    });
  });

  describe("getStringSetting", () => {
    it("delegates to getSetting", async () => {
      pool.query.mockResolvedValue({ rows: [{ value: "hello" }] });
      expect(await getStringSetting("key")).toBe("hello");
    });
  });

  describe("getNumberSetting", () => {
    it("returns parsed number", async () => {
      pool.query.mockResolvedValue({ rows: [{ value: "42" }] });
      expect(await getNumberSetting("key")).toBe(42);
    });

    it("returns null for missing key", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await getNumberSetting("missing")).toBeNull();
    });
  });

  describe("updateSetting", () => {
    it("upserts setting value", async () => {
      pool.query.mockResolvedValue({
        rows: [{ id: 1, key: "company_name", value: "Test" }],
      });

      const result = await updateSetting("company_name", "Test");

      expect(result.key).toBe("company_name");
      expect(result.value).toBe("Test");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO system_settings"),
        ["company_name", "Test"],
      );
    });

    it("rejects invalid timezone when key is company_timezone", async () => {
      await expect(
        updateSetting("company_timezone", "Invalid/Zone"),
      ).rejects.toThrow("Invalid timezone");
    });

    it("accepts valid timezone for company_timezone key", async () => {
      pool.query.mockResolvedValue({
        rows: [{ key: "company_timezone", value: "Asia/Manila" }],
      });

      const result = await updateSetting("company_timezone", "Asia/Manila");
      expect(result.value).toBe("Asia/Manila");
    });
  });

  describe("getAllSettings", () => {
    it("returns all settings rows", async () => {
      const mockRows = [
        { id: 1, key: "k1", value: "v1", description: "d1", updated_at: "2026-01-01" },
        { id: 2, key: "k2", value: "v2", description: "d2", updated_at: "2026-01-02" },
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      const result = await getAllSettings();
      expect(result).toEqual(mockRows);
    });
  });

  describe("toggleSetting", () => {
    it("flips false to true", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ value: "false" }] });
      pool.query.mockResolvedValueOnce({ rows: [{ key: "notif_enabled", value: "true" }] });

      const result = await toggleSetting("notif_enabled");

      expect(result).toEqual({ key: "notif_enabled", value: true });
    });

    it("flips true to false", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ value: "true" }] });
      pool.query.mockResolvedValueOnce({ rows: [{ key: "notif_enabled", value: "false" }] });

      const result = await toggleSetting("notif_enabled");

      expect(result).toEqual({ key: "notif_enabled", value: false });
    });
  });
});
