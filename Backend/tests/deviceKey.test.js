const { generateDeviceKey, hashDeviceKey, validateDeviceKey } = require("../utils/deviceKey");

describe("generateDeviceKey", () => {
  it("returns a string starting with dev_", () => {
    const key = generateDeviceKey();
    expect(key).toMatch(/^dev_/);
  });

  it("returns a key longer than 64 characters (prefix + 64 hex chars)", () => {
    const key = generateDeviceKey();
    expect(key.length).toBeGreaterThan(64);
  });

  it("generates unique keys on successive calls", () => {
    const key1 = generateDeviceKey();
    const key2 = generateDeviceKey();
    expect(key1).not.toBe(key2);
  });
});

describe("hashDeviceKey", () => {
  it("returns a 64-character hex string (SHA-256)", () => {
    const hash = hashDeviceKey("dev_test_key");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic for the same input", () => {
    const hash1 = hashDeviceKey("dev_test_key");
    const hash2 = hashDeviceKey("dev_test_key");
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different inputs", () => {
    const hash1 = hashDeviceKey("dev_key_a");
    const hash2 = hashDeviceKey("dev_key_b");
    expect(hash1).not.toBe(hash2);
  });

  it("handles empty string input", () => {
    const hash = hashDeviceKey("");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("validateDeviceKey", () => {
  it("returns true for a valid key-hash pair", () => {
    const key = "dev_my_test_key_12345";
    const hash = hashDeviceKey(key);
    expect(validateDeviceKey(key, hash)).toBe(true);
  });

  it("returns false for an invalid key-hash pair", () => {
    const key = "dev_my_test_key_12345";
    const wrongHash = hashDeviceKey("dev_different_key");
    expect(validateDeviceKey(key, wrongHash)).toBe(false);
  });

  it("returns false when key is null", () => {
    expect(validateDeviceKey(null, "somehash")).toBe(false);
  });

  it("returns false when hash is null", () => {
    expect(validateDeviceKey("dev_key", null)).toBe(false);
  });

  it("returns false when both are null", () => {
    expect(validateDeviceKey(null, null)).toBe(false);
  });

  it("returns false when key is empty string", () => {
    const hash = hashDeviceKey("dev_key");
    expect(validateDeviceKey("", hash)).toBe(false);
  });

  it("returns false when hash is empty string", () => {
    expect(validateDeviceKey("dev_key", "")).toBe(false);
  });
});
