const express = require("express");
const router = express.Router({ mergeParams: true });
const familyController = require("../controllers/applicantFamily.controller");
const educationController = require("../controllers/applicantEducation.controller");
const experienceController = require("../controllers/applicantWorkExperience.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.use(authenticate);

// Family routes
router.get("/family", requirePermission("recruitment.view"), familyController.getByApplicantId);
router.post("/family", requirePermission("recruitment.applicants.manage"), familyController.create);
router.put("/family/:id", requirePermission("recruitment.applicants.manage"), familyController.update);
router.delete("/family/:id", requirePermission("recruitment.applicants.manage"), familyController.remove);

// Education routes
router.get("/education", requirePermission("recruitment.view"), educationController.getByApplicantId);
router.post("/education", requirePermission("recruitment.applicants.manage"), educationController.create);
router.put("/education/:id", requirePermission("recruitment.applicants.manage"), educationController.update);
router.delete("/education/:id", requirePermission("recruitment.applicants.manage"), educationController.remove);

// Work experience routes
router.get("/experience", requirePermission("recruitment.view"), experienceController.getByApplicantId);
router.post("/experience", requirePermission("recruitment.applicants.manage"), experienceController.create);
router.put("/experience/:id", requirePermission("recruitment.applicants.manage"), experienceController.update);
router.delete("/experience/:id", requirePermission("recruitment.applicants.manage"), experienceController.remove);

module.exports = router;
