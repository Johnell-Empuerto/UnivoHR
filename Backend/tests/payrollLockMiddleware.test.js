jest.mock("../config/db", () => ({
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() }),
  end: jest.fn(),
}));

const pool = require("../config/db");
const payrollLock = require("../middleware/payrollLock.middleware");

describe("payrollLock.middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("calls next() when payroll is not locked (ACTIVE status)", async () => {
    req.params = { id: "10" };
    pool.query.mockResolvedValue({ rows: [{ status: "ACTIVE" }] });

    await payrollLock(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() when payroll has PENDING status", async () => {
    req.params = { id: "10" };
    pool.query.mockResolvedValue({ rows: [{ status: "PENDING" }] });

    await payrollLock(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("blocks mutation when payroll is LOCKED with status 423", async () => {
    req.params = { id: "10" };
    pool.query.mockResolvedValue({ rows: [{ status: "LOCKED" }] });

    await payrollLock(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(423);
    expect(res.json).toHaveBeenCalledWith({
      message: "Payroll is locked and cannot be modified",
    });
  });

  it("blocks mutation when payroll is PAID with status 423", async () => {
    req.params = { id: "10" };
    pool.query.mockResolvedValue({ rows: [{ status: "PAID" }] });

    await payrollLock(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(423);
    expect(res.json).toHaveBeenCalledWith({
      message: "Payroll has already been paid and cannot be modified",
    });
  });

  it("returns 404 when payroll ID is not found", async () => {
    req.params = { id: "999" };
    pool.query.mockResolvedValue({ rows: [] });

    await payrollLock(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Payroll not found",
    });
  });

  it("calls next() when payroll id param is missing", async () => {
    await payrollLock(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("handles pool.query error with 500", async () => {
    req.params = { id: "10" };
    pool.query.mockRejectedValue(new Error("DB connection lost"));

    await payrollLock(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error checking payroll status",
    });
  });

  it("queries payroll by the given ID", async () => {
    req.params = { id: "42" };
    pool.query.mockResolvedValue({ rows: [{ status: "PENDING" }] });

    await payrollLock(req, res, next);

    expect(pool.query).toHaveBeenCalledWith(
      "SELECT status FROM payroll WHERE id = $1",
      ["42"],
    );
  });
});
