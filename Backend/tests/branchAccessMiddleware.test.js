jest.mock("../utils/branchAccess", () => {
  const normalizeBranchId = (branchId) => {
    if (branchId === undefined || branchId === null) return null;
    if (branchId === "" || branchId === "all") return null;
    const num = Number(branchId);
    if (!Number.isInteger(num) || num < 1) {
      throw new Error(`Invalid branch_id: "${branchId}"`);
    }
    return num;
  };
  return {
    getUserBranchIds: jest.fn(),
    normalizeBranchId,
  };
});

const {
  requireBranchAccessFromQuery,
  requireBranchAccessFromBody,
} = require("../middleware/branchAccess.middleware");
const { getUserBranchIds } = require("../utils/branchAccess");

describe("branchAccess.middleware requireBranchAccessFromQuery", () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {}, user: { role: "ADMIN", id: 1 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("allows ADMIN and sets allowedBranchIds to [branchId]", async () => {
    req.query = { branch_id: "5" };
    req.user = { role: "ADMIN", id: 1 };
    const handler = requireBranchAccessFromQuery();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.allowedBranchIds).toEqual([5]);
    expect(getUserBranchIds).not.toHaveBeenCalled();
  });

  it("allows ADMIN with no branch_id sets allowedBranchIds to null", async () => {
    req.user = { role: "ADMIN", id: 1 };
    const handler = requireBranchAccessFromQuery();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.allowedBranchIds).toBeNull();
  });

  it("blocks EMPLOYEE with a 403", async () => {
    req.query = { branch_id: "5" };
    req.user = { role: "EMPLOYEE", id: 2 };
    const handler = requireBranchAccessFromQuery();

    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden: Employees cannot use branch filtering",
    });
  });

  it("allows MANAGER with branch access and sets allowedBranchIds", async () => {
    req.query = { branch_id: "5" };
    req.user = { role: "MANAGER", id: 3 };
    getUserBranchIds.mockResolvedValue([5, 10]);
    const handler = requireBranchAccessFromQuery();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.allowedBranchIds).toEqual([5]);
  });

  it("blocks MANAGER without access to requested branch", async () => {
    req.query = { branch_id: "99" };
    req.user = { role: "MANAGER", id: 3 };
    getUserBranchIds.mockResolvedValue([5, 10]);
    const handler = requireBranchAccessFromQuery();

    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden: No access to this branch",
    });
  });

  it("blocks MANAGER with no branch assignments", async () => {
    req.query = { branch_id: "5" };
    req.user = { role: "MANAGER", id: 3 };
    getUserBranchIds.mockResolvedValue([]);
    const handler = requireBranchAccessFromQuery();

    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden: No branch access assigned",
    });
  });

  it("sets allowedBranchIds to all assigned branches when no branch_id", async () => {
    req.user = { role: "MANAGER", id: 3 };
    getUserBranchIds.mockResolvedValue([1, 2, 3]);
    const handler = requireBranchAccessFromQuery();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.allowedBranchIds).toEqual([1, 2, 3]);
  });

  it("handles invalid branch_id with 400", async () => {
    req.query = { branch_id: "invalid" };
    req.user = { role: "ADMIN", id: 1 };
    const handler = requireBranchAccessFromQuery();

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid branch_id: "invalid"',
    });
  });

  it("uses custom param name", async () => {
    req.query = { location: "5" };
    req.user = { role: "ADMIN", id: 1 };
    const handler = requireBranchAccessFromQuery("location");

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.allowedBranchIds).toEqual([5]);
  });

  it("handles getUserBranchIds error gracefully", async () => {
    req.query = { branch_id: "5" };
    req.user = { role: "MANAGER", id: 3 };
    getUserBranchIds.mockRejectedValue(new Error("DB error"));
    const handler = requireBranchAccessFromQuery();

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "DB error",
    });
  });
});

describe("branchAccess.middleware requireBranchAccessFromBody", () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, user: { role: "ADMIN", id: 1 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("allows ADMIN and sets allowedBranchIds from body", async () => {
    req.body = { branch_id: "3" };
    req.user = { role: "ADMIN", id: 1 };
    const handler = requireBranchAccessFromBody();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.allowedBranchIds).toEqual([3]);
  });

  it("blocks EMPLOYEE from body", async () => {
    req.body = { branch_id: "3" };
    req.user = { role: "EMPLOYEE", id: 2 };
    const handler = requireBranchAccessFromBody();

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("allows MANAGER with branch access from body", async () => {
    req.body = { branch_id: "3" };
    req.user = { role: "MANAGER", id: 3 };
    getUserBranchIds.mockResolvedValue([3, 4]);
    const handler = requireBranchAccessFromBody();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.allowedBranchIds).toEqual([3]);
  });

  it("blocks MANAGER without access from body", async () => {
    req.body = { branch_id: "99" };
    req.user = { role: "MANAGER", id: 3 };
    getUserBranchIds.mockResolvedValue([3, 4]);
    const handler = requireBranchAccessFromBody();

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden: No access to this branch",
    });
  });

  it("uses custom body param name", async () => {
    req.body = { location: "3" };
    req.user = { role: "ADMIN", id: 1 };
    const handler = requireBranchAccessFromBody("location");

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.allowedBranchIds).toEqual([3]);
  });

  it("handles missing branch_id in body for MANAGER by using all assigned", async () => {
    req.user = { role: "MANAGER", id: 3 };
    getUserBranchIds.mockResolvedValue([1, 2]);
    const handler = requireBranchAccessFromBody();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.allowedBranchIds).toEqual([1, 2]);
  });
});
