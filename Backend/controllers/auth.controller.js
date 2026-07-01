const authService = require("../services/auth.service");
const audit = require("../services/audit.service");

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body, req);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { user_id, otp } = req.body;
    const reqInfo = authService.extractReqInfo(req);
    const result = await authService.verifyOTPAndLogin({ user_id, otp }, reqInfo);
    audit.auditLog(req, {
      action: "LOGIN_SUCCESS",
      table_name: "users",
      record_id: result.user?.id,
      employee_id: result.user?.employee_id,
      description: `OTP verified, login successful for user ${user_id}`,
    });
    res.json(result);
  } catch (error) {
    audit.auditLog(req, {
      action: "LOGIN_FAILED",
      table_name: "users",
      record_id: Number(req.body?.user_id) || null,
      description: `OTP verification failed for user ${req.body?.user_id}`,
    });
    res.status(401).json({ message: error.message });
  }
};

const resendOTP = async (req, res, next) => {
  try {
    const { user_id } = req.body;
    const result = await authService.resendOTP({ user_id });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }
    const result = await authService.forgotPassword({ username });
    res.json(result);
  } catch (error) {
    next(error);
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

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }
    const reqInfo = authService.extractReqInfo(req);
    const result = await authService.refreshToken(refreshToken, reqInfo);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const accessJti = req.user?.jti;
    const accessExp = req.user?.exp;

    const result = await authService.logout(accessJti, accessExp, refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const result = await authService.changePassword(req.user.id, { currentPassword, newPassword, confirmPassword });
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "users",
      record_id: req.user.id,
      description: `Password changed by user ${req.user.id}`,
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
  changePassword,
  refresh,
  logout,
};
