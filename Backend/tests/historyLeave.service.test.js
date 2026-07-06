jest.mock("../models/historyLeave.model", () => ({
  getAll: jest.fn(),
  getSummary: jest.fn(),
  getYearlySummary: jest.fn(),
  getEmployeeSummary: jest.fn(),
  getAvailableYears: jest.fn(),
}));

const historyLeaveModel = require("../models/historyLeave.model");
const {
  getAll, getSummary, getYearlySummary, getEmployeeSummary, getAvailableYears,
} = require("../services/historyLeave.service");

describe("historyLeave.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAll delegates", async () => {
    historyLeaveModel.getAll.mockResolvedValue([{ id: 1 }]);
    expect(await getAll(1, 10, "search", 2026)).toEqual([{ id: 1 }]);
  });

  it("getSummary delegates", async () => {
    historyLeaveModel.getSummary.mockResolvedValue({ total: 10 });
    expect(await getSummary()).toEqual({ total: 10 });
  });

  it("getYearlySummary delegates", async () => {
    historyLeaveModel.getYearlySummary.mockResolvedValue([]);
    expect(await getYearlySummary()).toEqual([]);
  });

  it("getEmployeeSummary delegates", async () => {
    historyLeaveModel.getEmployeeSummary.mockResolvedValue({ used: 5 });
    expect(await getEmployeeSummary(1)).toEqual({ used: 5 });
  });

  it("getAvailableYears delegates", async () => {
    historyLeaveModel.getAvailableYears.mockResolvedValue([2025, 2026]);
    expect(await getAvailableYears()).toEqual([2025, 2026]);
  });
});
