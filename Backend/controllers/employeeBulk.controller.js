const employeeBulkService = require("../services/employeeBulk.service");
const fs = require("fs");
const path = require("path");

const downloadTemplate = async (req, res) => {
  try {
    const workbook = await employeeBulkService.generateTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=employee_import_template.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("[EmployeeBulk] Template generation error:", error.message);
    res.status(500).json({ message: "Failed to generate template" });
  }
};

const validateImport = async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    filePath = req.file.path;

    const result = await employeeBulkService.parseAndValidate(filePath, req.user.id);

    res.json({
      success: true,
      batchId: result.batchId,
      summary: result.summary,
      previewRows: result.previewRows,
      errors: result.errors,
    });
  } catch (error) {
    console.error("[EmployeeBulk] Validation error:", error.message);
    res.status(400).json({ message: error.message });
  } finally {
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.error("[EmployeeBulk] File cleanup error:", cleanupErr.message);
      }
    }
  }
};

const commitImport = async (req, res) => {
  try {
    const { batchId } = req.body;
    if (!batchId) {
      return res.status(400).json({ message: "batchId is required" });
    }

    const result = await employeeBulkService.commitImport(batchId, req.user.id, req);

    res.json({
      success: true,
      message: `Imported ${result.importedCount} employees successfully.`,
      batchId,
      importedCount: result.importedCount,
      failedCount: result.failedCount,
    });
  } catch (error) {
    console.error("[EmployeeBulk] Commit error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

const getImportHistory = async (req, res) => {
  try {
    const history = await employeeBulkService.getImportHistory(req.user.id);
    res.json({ success: true, history });
  } catch (error) {
    console.error("[EmployeeBulk] History error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const downloadErrorReport = async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId, 10);
    if (isNaN(batchId)) {
      return res.status(400).json({ message: "Invalid batchId" });
    }

    const workbook = await employeeBulkService.generateErrorReport(batchId);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=employee_import_errors_batch_${batchId}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("[EmployeeBulk] Error report generation error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  downloadTemplate,
  validateImport,
  commitImport,
  getImportHistory,
  downloadErrorReport,
};