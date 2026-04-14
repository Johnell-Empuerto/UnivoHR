const authService = require("../services/auth.service");

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
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

module.exports = {
  login,
  verifyOTP,
  resendOTP,
};
