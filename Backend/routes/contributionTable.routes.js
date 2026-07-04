const express = require("express");
const router = express.Router();
const controller = require("../controllers/contributionTable.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/sss", authenticate, requirePermission("payroll.view"), controller.getSssTable);
router.get("/philhealth", authenticate, requirePermission("payroll.view"), controller.getPhilHealthTable);
router.get("/pagibig", authenticate, requirePermission("payroll.view"), controller.getPagIbigTable);
router.get("/withholding-tax", authenticate, requirePermission("payroll.view"), controller.getWithholdingTaxTable);

module.exports = router;
