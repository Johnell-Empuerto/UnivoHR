const authService = require("../services/auth.service");
const audit = require("../services/audit.service");

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    audit.auditLog(req, {
      action: "LOGIN",
      table_name: "users",
      record_id: result.user?.id,
      employee_id: result.user?.employee_id,
      new_values: { username: req.body.username },
      description: `User login: ${req.body.username}`,
    });
    res.json(result);
  } catch (error) {
    audit.auditLog(req, {
      action: "LOGIN",
      table_name: "users",
      new_values: { username: req.body.username },
      description: `Failed login attempt: ${req.body.username}`,
    });
    res.status(401).json({ message: error.message });
  }
};

//  ADD NEW CONTROLLER FUNCTIONS
const verifyOTP = async (req, res) => {
  try {
    const { user_id, otp } = req.body;
    const result = await authService.verifyOTPAndLogin({ user_id, otp });
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { user_id } = req.body;
    const result = await authService.resendOTP({ user_id });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }
    const result = await authService.forgotPassword({ username });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { user_id, otp, new_password } = req.body;
    if (!user_id || !otp || !new_password) {
      return res.status(400).json({
        message: "User ID, OTP, and new password are required",
      });
    }
    const result = await authService.resetPassword({ user_id, otp, new_password });
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "users",
      record_id: Number(user_id),
      description: `Password reset for user ${user_id}`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
};
