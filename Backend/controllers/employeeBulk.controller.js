const employeeBulkService = require("../services/employeeBulk.service");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const downloadTemplate = async (req, res, next) => {
  try {
    const workbook = await employeeBulkService.generateTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=employee_import_template.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[EmployeeBulk] Template generation error");
    next(error);
  }
};

const validateImport = async (req, res, next) => {
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
    logger.error({ err: error, correlationId: req.correlationId }, "[EmployeeBulk] Validation error");
    res.status(400).json({ message: error.message });
  } finally {
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        logger.error({ err: cleanupErr, correlationId: req.correlationId }, "[EmployeeBulk] File cleanup error");
      }
    }
  }
};

const commitImport = async (req, res, next) => {
  try {
    const { batchId } = req.body;
    if (!batchId) {
      return res.status(400).json({ message: "batchId is required" });
    }

    const result = await employeeBulkService.commitImport(batchId, req.user.id, req);

    const msg = result.accountsCreated > 0
      ? `Imported ${result.importedCount} employees with ${result.accountsCreated} accounts created successfully.`
      : `Imported ${result.importedCount} employees successfully.`;
    res.json({
      success: true,
      message: msg,
      batchId,
      importedCount: result.importedCount,
      accountsCreated: result.accountsCreated || 0,
      failedCount: result.failedCount,
    });
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[EmployeeBulk] Commit error");
    res.status(400).json({ message: error.message });
  }
};

const getImportHistory = async (req, res, next) => {
  try {
    const history = await employeeBulkService.getImportHistory(req.user.id);
    res.json({ success: true, history });
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[EmployeeBulk] History error");
    next(error);
  }
};

const downloadErrorReport = async (req, res, next) => {
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
    logger.error({ err: error, correlationId: req.correlationId }, "[EmployeeBulk] Error report generation error");
    next(error);
  }
};

module.exports = {
  downloadTemplate,
  validateImport,
  commitImport,
  getImportHistory,
  downloadErrorReport,
};