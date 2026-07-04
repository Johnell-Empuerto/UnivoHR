const express = require("express");
const router = express.Router();
const c = require("../controllers/contributionTable.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/sss", authenticate, requirePermission("payroll.view"), c.getSssTable);
router.post("/sss", authenticate, requirePermission("payroll.settings"), c.createSssRow);
router.put("/sss/:id", authenticate, requirePermission("payroll.settings"), c.updateSssRow);
router.delete("/sss/:id", authenticate, requirePermission("payroll.settings"), c.deleteSssRow);

router.get("/philhealth", authenticate, requirePermission("payroll.view"), c.getPhilHealthTable);
router.post("/philhealth", authenticate, requirePermission("payroll.settings"), c.createPhilHealthRow);
router.put("/philhealth/:id", authenticate, requirePermission("payroll.settings"), c.updatePhilHealthRow);
router.delete("/philhealth/:id", authenticate, requirePermission("payroll.settings"), c.deletePhilHealthRow);

router.get("/pagibig", authenticate, requirePermission("payroll.view"), c.getPagIbigTable);
router.post("/pagibig", authenticate, requirePermission("payroll.settings"), c.createPagIbigRow);
router.put("/pagibig/:id", authenticate, requirePermission("payroll.settings"), c.updatePagIbigRow);
router.delete("/pagibig/:id", authenticate, requirePermission("payroll.settings"), c.deletePagIbigRow);

router.get("/withholding-tax", authenticate, requirePermission("payroll.view"), c.getWithholdingTaxTable);
router.post("/withholding-tax", authenticate, requirePermission("payroll.settings"), c.createTaxRow);
router.put("/withholding-tax/:id", authenticate, requirePermission("payroll.settings"), c.updateTaxRow);
router.delete("/withholding-tax/:id", authenticate, requirePermission("payroll.settings"), c.deleteTaxRow);

module.exports = router;
