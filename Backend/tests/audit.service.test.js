jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../utils/logger", () => ({ error: jest.fn() }));

const pool = require("../config/db");
const logger = require("../utils/logger");
const { auditLog, fetchOldValues, log } = require("../services/audit.service");

describe("audit.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReq = {
    ip: "127.0.0.1",
    user: { id: 1 },
    headers: { "user-agent": "test-agent" },
    connection: {},
  };

  describe("auditLog", () => {
    it("inserts an audit log entry", async () => {
      pool.query.mockResolvedValue({});

      await auditLog(mockReq, {
        action: "UPDATE",
        table_name: "users",
        record_id: 42,
        employee_id: 5,
        branch_id: 3,
        old_values: { name: "old" },
        new_values: { name: "new" },
        description: "Updated user name",
      });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [text, params] = pool.query.mock.calls[0];
      expect(text).toContain("INSERT INTO audit_logs");
      expect(params[0]).toBe(1); // user_id
      expect(params[1]).toBe(5); // employee_id
      expect(params[2]).toBe(3); // branch_id
      expect(params[3]).toBe("UPDATE");
      expect(params[4]).toBe("users");
      expect(params[5]).toBe(42);
      expect(params[6]).toBe('{"name":"old"}');
      expect(params[7]).toBe('{"name":"new"}');
      expect(params[8]).toBe("127.0.0.1");
      expect(params[9]).toBe("test-agent");
      expect(params[10]).toBe("Updated user name");
    });

    it("handles missing req gracefully", async () => {
      pool.query.mockResolvedValue({});

      await auditLog(null, { action: "TEST", table_name: "users" });

      expect(pool.query).toHaveBeenCalled();
      const params = pool.query.mock.calls[0][1];
      expect(params[0]).toBeNull(); // user_id
      expect(params[8]).toBeNull(); // ip_address
      expect(params[9]).toBeNull(); // user_agent
    });

    it("logs error without throwing when DB fails", async () => {
      pool.query.mockRejectedValue(new Error("DB error"));

      await expect(
        auditLog(mockReq, { action: "TEST", table_name: "users" }),
      ).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("log", () => {
    it("delegates to auditLog with mapped field names", async () => {
      pool.query.mockResolvedValue({});

      await log({
        actor_id: 1,
        action: "CREATE",
        entity_type: "employees",
        entity_id: 99,
        employee_id: 99,
        old_values: null,
        new_values: { name: "John" },
        req: mockReq,
      });

      expect(pool.query).toHaveBeenCalled();
      const params = pool.query.mock.calls[0][1];
      expect(params[0]).toBe(1); // user_id from req
      expect(params[3]).toBe("CREATE");
      expect(params[4]).toBe("employees");
      expect(params[5]).toBe(99);
    });
  });

  describe("fetchOldValues", () => {
    it("fetches and returns old values from DB", async () => {
      pool.query.mockResolvedValue({
        rows: [{ data: { id: 1, name: "Old Name" } }],
      });

      const result = await fetchOldValues("users", 1);
      expect(result).toEqual({ id: 1, name: "Old Name" });
    });

    it("returns null when no record found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await fetchOldValues("users", 999);
      expect(result).toBeNull();
    });

    it("returns null when recordId is falsy", async () => {
      const result = await fetchOldValues("users", null);
      expect(result).toBeNull();
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("returns null for invalid table names (caught internally)", async () => {
      const result = await fetchOldValues("nonexistent_table", 1);
      expect(result).toBeNull();
    });
  });
});
