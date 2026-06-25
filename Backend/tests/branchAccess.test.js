const { normalizeBranchId } = require("../utils/branchAccess");

describe("normalizeBranchId", () => {
  it("returns null for undefined", () => {
    expect(normalizeBranchId(undefined)).toBeNull();
  });

  it("returns null for null", () => {
    expect(normalizeBranchId(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeBranchId("")).toBeNull();
  });

  it("returns null for 'all'", () => {
    expect(normalizeBranchId("all")).toBeNull();
  });

  it("parses numeric string to number", () => {
    expect(normalizeBranchId("5")).toBe(5);
  });

  it("parses numeric value to number", () => {
    expect(normalizeBranchId(3)).toBe(3);
  });

  it("throws for non-integer string", () => {
    expect(() => normalizeBranchId("abc")).toThrow("Invalid branch_id");
  });

  it("throws for float", () => {
    expect(() => normalizeBranchId(3.5)).toThrow("Invalid branch_id");
  });

  it("throws for zero", () => {
    expect(() => normalizeBranchId(0)).toThrow("Invalid branch_id");
  });

  it("throws for negative number", () => {
    expect(() => normalizeBranchId(-1)).toThrow("Invalid branch_id");
  });
});
