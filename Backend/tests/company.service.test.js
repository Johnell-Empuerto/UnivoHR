jest.mock("../config/db", () => ({ query: jest.fn() }));

const pool = require("../config/db");
const { getCompany } = require("../services/company.service");

describe("company.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCompany", () => {
    it("returns the latest company settings row", async () => {
      const mockRow = { id: 1, company_name: "Test Corp", address: "123 Main St" };
      pool.query.mockResolvedValue({ rows: [mockRow] });

      const result = await getCompany();
      expect(result).toEqual(mockRow);
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM company_settings ORDER BY id DESC LIMIT 1",
      );
    });

    it("returns undefined when no company settings exist", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await getCompany();
      expect(result).toBeUndefined();
    });
  });
});
