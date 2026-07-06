jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../utils/branchAccess", () => ({ getUserBranchIds: jest.fn() }));

const pool = require("../config/db");
const { getUserBranchIds } = require("../utils/branchAccess");
const { getDrillDownAttendance } = require("../services/drilldown.service");

describe("drilldown.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDrillDownAttendance", () => {
    it("returns paginated data for ADMIN", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, first_name: "John", status: "PRESENT" }] })
        .mockResolvedValueOnce({ rows: [{ count: "10" }] });

      const result = await getDrillDownAttendance(
        { id: 1, role: "ADMIN" },
        { status: "PRESENT", page: 1, limit: 10 },
      );

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(10);
    });

    it("returns empty for non-ADMIN with no branch access", async () => {
      getUserBranchIds.mockResolvedValue([]);

      const result = await getDrillDownAttendance(
        { id: 2, role: "USER" },
        { page: 1, limit: 20 },
      );

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it("filters by branch for non-ADMIN", async () => {
      getUserBranchIds.mockResolvedValue([1, 2]);
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, status: "LATE" }] })
        .mockResolvedValueOnce({ rows: [{ count: "1" }] });

      const result = await getDrillDownAttendance(
        { id: 2, role: "USER" },
        { status: "LATE", page: 1, limit: 10 },
      );

      expect(result.data).toHaveLength(1);
    });
  });
});
