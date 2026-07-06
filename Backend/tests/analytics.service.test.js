jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../models/anomaly.model", () => ({ getAnomalySummary: jest.fn() }));
jest.mock("../services/forecast.service", () => ({ predictNext: jest.fn() }));
jest.mock("../utils/branchAccess", () => ({ getUserBranchIds: jest.fn() }));

const pool = require("../config/db");
const anomalyModel = require("../models/anomaly.model");
const { getUserBranchIds } = require("../utils/branchAccess");
const { getCompanyOverview, getAttendanceSummary } = require("../services/analytics.service");

describe("analytics.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAttendanceSummary", () => {
    it("returns summary with branch filter", async () => {
      pool.query.mockResolvedValue({
        rows: [{ present: 10, late: 2, absent: 1, on_leave: 1, total: 14 }],
      });

      const result = await getAttendanceSummary([1, 2]);

      expect(result.present).toBe(10);
      expect(result.total).toBe(14);
      expect(pool.query.mock.calls[0][1]).toEqual([[1, 2]]);
    });

    it("returns zeros when no rows", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await getAttendanceSummary(null);
      expect(result).toEqual({ present: 0, late: 0, absent: 0, on_leave: 0, total: 0 });
    });
  });

  describe("getCompanyOverview", () => {
    it("returns overview for ADMIN user", async () => {
      pool.query.mockResolvedValue({ rows: [{ present: 5, late: 0, absent: 0, on_leave: 0, total: 5 }] });
      anomalyModel.getAnomalySummary.mockResolvedValue({ total: 0 });

      const result = await getCompanyOverview({ id: 1, role: "ADMIN" });

      expect(result.attendance.present).toBe(5);
      expect(result.anomalies.total).toBe(0);
      expect(result).toHaveProperty("timestamp");
    });

    it("filters by allowed branches for non-ADMIN", async () => {
      getUserBranchIds.mockResolvedValue([1]);
      pool.query.mockResolvedValue({ rows: [{ present: 3, late: 0, absent: 0, on_leave: 0, total: 3 }] });
      anomalyModel.getAnomalySummary.mockResolvedValue({ total: 0 });

      const result = await getCompanyOverview({ id: 2, role: "USER" });

      expect(result.attendance.present).toBe(3);
      expect(getUserBranchIds).toHaveBeenCalledWith(2);
    });
  });
});
