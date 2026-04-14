// routes/calendar.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/calendar.controller");
const bulkController = require("../controllers/calendar.bulk.controller");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");
const upload = require("../middleware/upload.middleware");

//GET ALL (everyone can view calendar)
router.get(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getCalendar,
);

// GET BY DATE (restricted)
router.get(
  "/:date",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getByDate,
);

// CREATE
router.post(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.create,
);

// UPDATE
router.put(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.update,
);

// DELETE (STRICT)
router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN]),
  controller.remove,
);

//  BULK UPLOAD (VERY SENSITIVE)
router.post(
  "/bulk",
  authenticate,
  authorize([ROLES.ADMIN]),
  bulkController.bulkUpload,
);

// DOWNLOAD TEMPLATE
router.get(
  "/bulk/template",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  bulkController.downloadTemplate,
);

module.exports = router;
