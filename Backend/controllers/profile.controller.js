const profileService = require("../services/profile.service");

// Get current user's profile
const getProfile = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    if (!employeeId) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    const profile = await profileService.getProfile(employeeId);
    res.json(profile);
  } catch (error) {
    if (error.message === "Profile not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update user's own profile (limited fields for self-service)
const updateProfile = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    if (!employeeId) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // Only allow updating specific fields
    const allowedFields = [
      "contact_number",
      "address",
      "emergency_contact_name",
      "emergency_contact_number",
      "emergency_contact_address",
      "emergency_contact_relation",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updated = await profileService.updateProfile(employeeId, updateData);
    res.json({
      message: "Profile updated successfully",
      profile: updated,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
