jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../models/leaveCredit.model", () => ({ createDefault: jest.fn() }));

const pool = require("../config/db");
const leaveCreditModel = require("../models/leaveCredit.model");
const { initializeNewEmployee } = require("../services/employeeInit.service");

describe("employeeInit.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("initializes new employee with default salary and leave credits", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    leaveCreditModel.createDefault.mockResolvedValue();
    const result = await initializeNewEmployee(1);
    expect(result).toBe(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("employee_salary"),
      [1]
    );
    expect(leaveCreditModel.createDefault).toHaveBeenCalledWith(1, pool);
  });

  it("uses provided client instead of pool when given", async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    leaveCreditModel.createDefault.mockResolvedValue();
    await initializeNewEmployee(1, client);
    expect(client.query).toHaveBeenCalled();
    expect(pool.query).not.toHaveBeenCalled();
  });
});
