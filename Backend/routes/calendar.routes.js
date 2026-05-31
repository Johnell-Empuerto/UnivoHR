// routes/calendar.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/calendar.controller");
const bulkController = require("../controllers/calendar.bulk.controller");

const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const upload = require("../middleware/upload.middleware");

router.get("/", authenticate, requirePermission("calendar.view"), controller.getCalendar);
router.get("/:date", authenticate, requirePermission("calendar.view"), controller.getByDate);
router.post("/", authenticate, requirePermission("calendar.manage"), controller.create);
router.put("/:id", authenticate, requirePermission("calendar.manage"), controller.update);
router.delete("/:id", authenticate, requirePermission("calendar.manage"), controller.remove);
router.post("/bulk", authenticate, requirePermission("calendar.manage"), bulkController.bulkUpload);
router.get("/bulk/template", authenticate, requirePermission("calendar.manage"), bulkController.downloadTemplate);

module.exports = router;
