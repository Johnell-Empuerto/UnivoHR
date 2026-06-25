const { ALL_PERMISSIONS, PERMISSION_GROUPS, EMPLOYEE_DEFAULT_PERMISSIONS } = require("../constants/permissions");
const { ROLES } = require("../constants/roles");

describe("ALL_PERMISSIONS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(ALL_PERMISSIONS)).toBe(true);
    expect(ALL_PERMISSIONS.length).toBeGreaterThan(0);
  });

  it("contains only strings with dot notation", () => {
    ALL_PERMISSIONS.forEach((p) => {
      expect(typeof p).toBe("string");
      expect(p).toMatch(/^[a-z_]+(\.[a-z_]+)*$/);
    });
  });

  it("contains no duplicates", () => {
    const unique = new Set(ALL_PERMISSIONS);
    expect(unique.size).toBe(ALL_PERMISSIONS.length);
  });
});

describe("PERMISSION_GROUPS", () => {
  it("has all groups as non-empty arrays", () => {
    const groups = Object.keys(PERMISSION_GROUPS);
    expect(groups.length).toBeGreaterThan(0);
    groups.forEach((group) => {
      expect(Array.isArray(PERMISSION_GROUPS[group])).toBe(true);
      expect(PERMISSION_GROUPS[group].length).toBeGreaterThan(0);
    });
  });

  it("every group permission exists in ALL_PERMISSIONS", () => {
    const allPermsSet = new Set(ALL_PERMISSIONS);
    Object.values(PERMISSION_GROUPS).forEach((perms) => {
      perms.forEach((p) => {
        expect(allPermsSet.has(p)).toBe(true);
      });
    });
  });

  it("every ALL_PERMISSIONS entry appears in at least one group", () => {
    const groupedPerms = new Set(Object.values(PERMISSION_GROUPS).flat());
    ALL_PERMISSIONS.forEach((p) => {
      expect(groupedPerms.has(p)).toBe(true);
    });
  });
});

describe("EMPLOYEE_DEFAULT_PERMISSIONS", () => {
  it("is a subset of ALL_PERMISSIONS", () => {
    const allPermsSet = new Set(ALL_PERMISSIONS);
    EMPLOYEE_DEFAULT_PERMISSIONS.forEach((p) => {
      expect(allPermsSet.has(p)).toBe(true);
    });
  });

  it("contains no duplicates", () => {
    const unique = new Set(EMPLOYEE_DEFAULT_PERMISSIONS);
    expect(unique.size).toBe(EMPLOYEE_DEFAULT_PERMISSIONS.length);
  });

  it("is a smaller set than ALL_PERMISSIONS (employees don't get everything)", () => {
    expect(EMPLOYEE_DEFAULT_PERMISSIONS.length).toBeLessThan(ALL_PERMISSIONS.length);
  });
});

describe("ROLES", () => {
  it("defines ADMIN and EMPLOYEE roles", () => {
    expect(ROLES.ADMIN).toBe("ADMIN");
    expect(ROLES.EMPLOYEE).toBe("EMPLOYEE");
  });

  it("has exactly 2 roles defined", () => {
    expect(Object.keys(ROLES).length).toBe(2);
  });
});
