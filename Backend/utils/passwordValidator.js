const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
};

const SPECIAL_CHARS_RE = /[!@#$%^&*(),.?":{}|<>_\-~`[\]\\;/']/;

const validatePassword = (password, username) => {
  const errors = [];

  if (!password) {
    errors.push("Password is required");
    return errors;
  }

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters`);
  }

  if (password.length > PASSWORD_RULES.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_RULES.maxLength} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!SPECIAL_CHARS_RE.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  if (/\s/.test(password)) {
    errors.push("Password must not contain spaces");
  }

  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    errors.push("Password must not contain your username");
  }

  return errors;
};

module.exports = { validatePassword };
