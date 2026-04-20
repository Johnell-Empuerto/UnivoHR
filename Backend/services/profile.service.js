const profileModel = require("../models/profile.model");

// Calculate age from birthday
const calculateAge = (birthday) => {
  if (!birthday) return null;
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

// Get current user's profile
const getProfile = async (employeeId) => {
  const employee = await profileModel.getProfileByEmployeeId(employeeId);

  if (!employee) {
    throw new Error("Profile not found");
  }

  // Calculate age from birthday
  const age = calculateAge(employee.birthday);

  // Format the response
  return {
    ...employee,
    age,
    full_name: `${employee.first_name || ""} ${employee.middle_name || ""} ${employee.last_name || ""}${employee.suffix ? `, ${employee.suffix}` : ""}`.trim(),
  };
};

// Update user's own profile (limited fields)
const updateProfile = async (employeeId, data) => {
  const updated = await profileModel.updateProfile(employeeId, data);
  return updated;
};

module.exports = {
  getProfile,
  updateProfile,
  calculateAge,
};
