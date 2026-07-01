const profileService = require("../services/profile.service");
const audit = require("../services/audit.service");

// Get current user's profile
const getProfile = async (req, res, next) => {
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
    next(error);
  }
};

// Update user's own profile (limited fields for self-service)
const updateProfile = async (req, res, next) => {
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
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "employees",
      record_id: Number(employeeId),
      employee_id: Number(employeeId),
      new_values: updateData,
      description: `Profile updated by employee ${employeeId}`,
    });
    res.json({
      message: "Profile updated successfully",
      profile: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
