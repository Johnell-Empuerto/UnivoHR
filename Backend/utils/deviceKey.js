const crypto = require("crypto");

const KEY_BYTES = 32;
const HASH_ALGO = "sha256";
const KEY_PREFIX = "dev_";

const generateDeviceKey = () => {
  const raw = crypto.randomBytes(KEY_BYTES).toString("hex");
  return `${KEY_PREFIX}${raw}`;
};

const hashDeviceKey = (key) => {
  return crypto.createHash(HASH_ALGO).update(key).digest("hex");
};

const validateDeviceKey = (key, hash) => {
  if (!key || !hash) return false;
  const computed = hashDeviceKey(key);
  if (computed.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
};

module.exports = { generateDeviceKey, hashDeviceKey, validateDeviceKey };
