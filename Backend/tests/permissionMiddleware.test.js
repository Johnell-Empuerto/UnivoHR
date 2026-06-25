jest.mock("../services/permission.service");

const requirePermission = require("../middleware/permission.middleware");
const { hasPermission } = require("../services/permission.service");

describe("permission.middleware requirePermission()", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("returns 401 when req.user is missing", async () => {
    const handler = requirePermission("employees.view");

    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorized: No user found",
    });
  });

  it("allows ADMIN immediately without checking permissions", async () => {
    req.user = { role: "ADMIN", id: 1 };
    const handler = requirePermission("employees.view");

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(hasPermission).not.toHaveBeenCalled();
  });

  it("blocks non-ADMIN when hasPermission returns false", async () => {
    req.user = { role: "EMPLOYEE", id: 2 };
    hasPermission.mockResolvedValue(false);
    const handler = requirePermission("employees.view");

    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden: Insufficient permissions",
      required: "employees.view",
    });
  });

  it("allows non-ADMIN when hasPermission returns true", async () => {
    req.user = { role: "EMPLOYEE", id: 2 };
    hasPermission.mockResolvedValue(true);
    const handler = requirePermission("employees.view");

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("calls hasPermission with user and permission key", async () => {
    req.user = { role: "EMPLOYEE", id: 42 };
    hasPermission.mockResolvedValue(true);
    const handler = requirePermission("employees.edit");

    await handler(req, res, next);

    expect(hasPermission).toHaveBeenCalledWith(
      { role: "EMPLOYEE", id: 42 },
      "employees.edit",
    );
  });

  it("checks multiple permission keys for non-ADMIN", async () => {
    req.user = { role: "EMPLOYEE", id: 2 };
    hasPermission.mockResolvedValue(true);
    const handler = requirePermission("employees.view", "employees.edit");

    await handler(req, res, next);

    expect(hasPermission).toHaveBeenCalledTimes(2);
    expect(hasPermission).toHaveBeenCalledWith(
      { role: "EMPLOYEE", id: 2 },
      "employees.view",
    );
    expect(hasPermission).toHaveBeenCalledWith(
      { role: "EMPLOYEE", id: 2 },
      "employees.edit",
    );
  });

  it("returns 403 with required array when multiple keys and first fails", async () => {
    req.user = { role: "EMPLOYEE", id: 2 };
    hasPermission.mockResolvedValue(false);
    const handler = requirePermission("employees.view", "employees.edit");

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden: Insufficient permissions",
      required: ["employees.view", "employees.edit"],
    });
  });

  it("returns 500 on internal error", async () => {
    req.user = { role: "EMPLOYEE", id: 2 };
    hasPermission.mockRejectedValue(new Error("DB connection failed"));
    const handler = requirePermission("employees.view");

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error checking permissions",
    });
  });

  it("preserves the handler for multiple calls", async () => {
    req.user = { role: "ADMIN", id: 1 };
    const handler = requirePermission("employees.view");

    await handler(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    next.mockClear();

    await handler(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
