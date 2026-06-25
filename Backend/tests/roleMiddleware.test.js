const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

describe("role.middleware authorize()", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("allows ADMIN when ADMIN is in allowedRoles", () => {
    req.user = { role: "ADMIN" };
    const handler = authorize(["ADMIN"]);

    handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("blocks EMPLOYEE when only ADMIN is required", () => {
    req.user = { role: "EMPLOYEE" };
    const handler = authorize(["ADMIN"]);

    handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden: Insufficient permissions",
      required: ["ADMIN"],
      yourRole: "EMPLOYEE",
    });
  });

  it("returns 401 when req.user is missing", () => {
    const handler = authorize(["ADMIN"]);

    handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorized: No user found",
    });
  });

  it("calls next() when role is allowed", () => {
    req.user = { role: "EMPLOYEE" };
    const handler = authorize(["ADMIN", "EMPLOYEE"]);

    handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 403 with correct structure for blocked role", () => {
    req.user = { role: "EMPLOYEE" };
    const handler = authorize(["ADMIN"]);

    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg).toMatchObject({
      message: "Forbidden: Insufficient permissions",
      required: ["ADMIN"],
      yourRole: "EMPLOYEE",
    });
  });

  it("allows req.user with any role when that role is in allowedRoles", () => {
    req.user = { role: "MANAGER" };
    const handler = authorize(["MANAGER", "ADMIN"]);

    handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("uses ROLES constants correctly", () => {
    expect(ROLES.ADMIN).toBe("ADMIN");
    expect(ROLES.EMPLOYEE).toBe("EMPLOYEE");
  });
});
