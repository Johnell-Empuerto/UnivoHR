// middleware/role.middleware.js
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    const userRole = req.user.role;
    console.log("Checking role:", userRole, "Allowed:", allowedRoles);

    // Check if user role is allowed
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Forbidden: Insufficient permissions",
        required: allowedRoles,
        yourRole: userRole,
      });
    }

    next();
  };
};

module.exports = authorize;
