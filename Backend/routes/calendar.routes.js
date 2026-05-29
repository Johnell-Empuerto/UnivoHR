// routes/calendar.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/calendar.controller");
const bulkController = require("../controllers/calendar.bulk.controller");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");
const upload = require("../middleware/upload.middleware");

const ALL = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER, ROLES.EMPLOYEE];
const ADMIN_ONLY = [ROLES.ADMIN];

router.get("/", authenticate, authorize(ALL), controller.getCalendar);
router.get("/:date", authenticate, authorize(ALL), controller.getByDate);
router.post("/", authenticate, authorize(ADMIN_ONLY), controller.create);
router.put("/:id", authenticate, authorize(ADMIN_ONLY), controller.update);
router.delete("/:id", authenticate, authorize(ADMIN_ONLY), controller.remove);
router.post("/bulk", authenticate, authorize(ADMIN_ONLY), bulkController.bulkUpload);
router.get("/bulk/template", authenticate, authorize(ADMIN_ONLY), bulkController.downloadTemplate);

module.exports = router;
