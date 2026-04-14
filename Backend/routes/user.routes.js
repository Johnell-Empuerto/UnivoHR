const express = require("express");
const router = express.Router();
const controller = require("../controllers/user.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// All user routes require ADMIN role
router.use(authenticate, authorize([ROLES.ADMIN]));

// GET users with pagination and filters
router.get("/", controller.getUsers);

// GET employees without accounts
router.get("/available-employees", controller.getEmployeesWithoutAccounts);

// GET user by ID
router.get("/:id", controller.getUserById);

// CREATE user
router.post("/", controller.createUser);

// UPDATE user
router.put("/:id", controller.updateUser);

// DELETE user
router.delete("/:id", controller.deleteUser);

// GET employee name by ID
router.get("/employee/:employeeId", controller.getEmployeeName);

module.exports = router;
