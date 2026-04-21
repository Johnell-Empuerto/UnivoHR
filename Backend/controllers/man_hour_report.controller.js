const manHourReportService = require("../services/man_hour_report.service");
const notificationService = require("../services/notification.service");
const pool = require("../config/db");

const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");
const { generateManhourPDF } = require("../utils/manhourGenerator");

const downloadManHourReports = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      employee_id = null,
      format = "csv", // csv, excel, pdf
    } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        message: "start_date and end_date are required",
      });
    }

    // Fetch summary data
    const summary = await manHourReportService.getManHourSummary(
      start_date,
      end_date,
      employee_id,
    );

    // Fetch detailed data
    let detailedData = [];
    for (const emp of summary) {
      const details = await manHourReportService.getDetailedReports(
        emp.employee_id,
        start_date,
        end_date,
      );
      detailedData.push(...details);
    }

    // Prepare data for export
    const exportData = {
      summary,
      details: detailedData,
      filters: {
        start_date,
        end_date,
        employee_id: employee_id || "All Employees",
        generated_at: new Date().toISOString(),
      },
    };

    switch (format.toLowerCase()) {
      case "csv":
        await exportToCSV(res, exportData);
        break;
      case "excel":
        await exportToExcel(res, exportData);
        break;
      case "pdf":
        await exportToPDF(res, exportData);
        break;
      default:
        await exportToCSV(res, exportData);
    }
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// EXPORT TO CSV
// ==========================================

const exportToCSV = async (res, exportData) => {
  const { summary, details, filters } = exportData;

  // Summary rows
  const summaryRows = summary.map((s) => ({
    "Employee Code": s.employee_code,
    "Employee Name": s.employee_name,
    "Total Reports": s.total_reports,
    "Total Hours": s.total_hours,
    "Total Activities": s.total_activities,
  }));

  // Detail rows
  const detailRows = details.map((d) => ({
    "Employee Code": d.employee_code,
    "Employee Name": d.employee_name,
    "Work Date": d.work_date,
    Task: d.task,
    Hours: d.hours,
    Status: d.status || "SUBMITTED",
    "Time From": d.time_from || "",
    "Time To": d.time_to || "",
    Activity: d.activity || "",
    Remarks: d.remarks || "",
  }));

  // Create CSV parsers
  const summaryParser = new Parser({
    fields: Object.keys(summaryRows[0] || {}),
  });
  const detailParser = new Parser({ fields: Object.keys(detailRows[0] || {}) });

  let csv = "MAN HOUR REPORT SUMMARY\n";
  csv += `Generated: ${filters.generated_at}\n`;
  csv += `Period: ${filters.start_date} to ${filters.end_date}\n`;
  csv += `Employee Filter: ${filters.employee_id}\n\n`;

  csv += "=== SUMMARY ===\n";
  if (summaryRows.length > 0) {
    csv += summaryParser.parse(summaryRows);
  } else {
    csv += "No data found\n";
  }

  csv += "\n=== DETAILED REPORT ===\n";
  if (detailRows.length > 0) {
    csv += detailParser.parse(detailRows);
  } else {
    csv += "No details found\n";
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=man_hour_report_${filters.start_date}_to_${filters.end_date}.csv`,
  );
  res.send(csv);
};

// ==========================================
// EXPORT TO EXCEL
// ==========================================

const exportToExcel = async (res, exportData) => {
  const { summary, details, filters } = exportData;
  const workbook = new ExcelJS.Workbook();

  // ========== SHEET 1: COVER PAGE ==========
  const coverSheet = workbook.addWorksheet("Cover Page");
  coverSheet.mergeCells("A1:D1");
  coverSheet.getCell("A1").value = "MAN HOUR REPORT";
  coverSheet.getCell("A1").font = { size: 20, bold: true };
  coverSheet.getCell("A1").alignment = { horizontal: "center" };

  coverSheet.mergeCells("A3:D3");
  coverSheet.getCell("A3").value = `Generated: ${filters.generated_at}`;
  coverSheet.mergeCells("A4:D4");
  coverSheet.getCell("A4").value =
    `Period: ${filters.start_date} to ${filters.end_date}`;
  coverSheet.mergeCells("A5:D5");
  coverSheet.getCell("A5").value = `Employee Filter: ${filters.employee_id}`;

  // ========== SHEET 2: SUMMARY ==========
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Employee Code", key: "code", width: 15 },
    { header: "Employee Name", key: "name", width: 25 },
    { header: "Total Reports", key: "reports", width: 15 },
    { header: "Total Hours", key: "hours", width: 15 },
    { header: "Total Activities", key: "activities", width: 18 },
  ];

  summary.forEach((s) => {
    summarySheet.addRow({
      code: s.employee_code,
      name: s.employee_name,
      reports: s.total_reports,
      hours: s.total_hours,
      activities: s.total_activities,
    });
  });

  // Style header row
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  summarySheet.getRow(1).font = { color: { argb: "FFFFFFFF" } };

  // ========== SHEET 3: DETAILS ==========
  const detailsSheet = workbook.addWorksheet("Details");
  detailsSheet.columns = [
    { header: "Employee Code", key: "code", width: 15 },
    { header: "Employee Name", key: "name", width: 25 },
    { header: "Work Date", key: "date", width: 12 },
    { header: "Task", key: "task", width: 30 },
    { header: "Hours", key: "hours", width: 10 },
    { header: "Status", key: "status", width: 12 },
    { header: "Time From", key: "time_from", width: 12 },
    { header: "Time To", key: "time_to", width: 12 },
    { header: "Activity", key: "activity", width: 30 },
    { header: "Remarks", key: "remarks", width: 30 },
  ];

  details.forEach((d) => {
    detailsSheet.addRow({
      code: d.employee_code,
      name: d.employee_name,
      date: d.work_date,
      task: d.task,
      hours: d.hours,
      status: d.status || "SUBMITTED",
      time_from: d.time_from || "",
      time_to: d.time_to || "",
      activity: d.activity || "",
      remarks: d.remarks || "",
    });
  });

  detailsSheet.getRow(1).font = { bold: true };
  detailsSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF70AD47" },
  };
  detailsSheet.getRow(1).font = { color: { argb: "FFFFFFFF" } };

  // ========== SHEET 4: PER EMPLOYEE ==========
  const employeeMap = new Map();
  details.forEach((d) => {
    if (!employeeMap.has(d.employee_id)) {
      employeeMap.set(d.employee_id, {
        code: d.employee_code,
        name: d.employee_name,
        reports: [],
      });
    }
    employeeMap.get(d.employee_id).reports.push(d);
  });

  for (const [empId, empData] of employeeMap) {
    const sheet = workbook.addWorksheet(
      empData.name.substring(0, 31), // Excel sheet name max 31 chars
    );
    sheet.columns = [
      { header: "Work Date", key: "date", width: 12 },
      { header: "Task", key: "task", width: 30 },
      { header: "Hours", key: "hours", width: 10 },
      { header: "Status", key: "status", width: 12 },
      { header: "Time From", key: "time_from", width: 12 },
      { header: "Time To", key: "time_to", width: 12 },
      { header: "Activity", key: "activity", width: 30 },
      { header: "Remarks", key: "remarks", width: 30 },
    ];

    empData.reports.forEach((r) => {
      sheet.addRow({
        date: r.work_date,
        task: r.task,
        hours: r.hours,
        status: r.status || "SUBMITTED",
        time_from: r.time_from || "",
        time_to: r.time_to || "",
        activity: r.activity || "",
        remarks: r.remarks || "",
      });
    });

    // Add total row
    const totalHours = empData.reports.reduce(
      (sum, r) => sum + parseFloat(r.hours),
      0,
    );
    sheet.addRow({});
    sheet.addRow({
      date: "TOTAL",
      hours: totalHours.toFixed(2),
    });
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=man_hour_report_${filters.start_date}_to_${filters.end_date}.xlsx`,
  );

  await workbook.xlsx.write(res);
  res.end();
};

// ==========================================
// EXPORT TO PDF
// ==========================================

const exportToPDF = async (res, exportData) => {
  try {
    await generateManhourPDF(res, exportData);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

// ==========================================
// HELPER: Professional Table with Borders
// ==========================================

const drawProfessionalTable = (doc, headers, rows, startY) => {
  const startX = 50;
  let currentY = startY;
  const rowHeight = 25;
  const headerHeight = 25;

  // Calculate column widths based on content
  const colWidths = [70, 60, 70, 200];

  // Calculate total table width
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const endX = startX + tableWidth;

  // ========== DRAW HEADER ==========
  // Header background
  doc.rect(startX, currentY, tableWidth, headerHeight).fill("#4472C4");

  // Header text
  doc.fillColor("white").font("Helvetica-Bold").fontSize(10);

  let currentX = startX;
  headers.forEach((header, i) => {
    doc.text(header, currentX + 5, currentY + 8, {
      width: colWidths[i] - 10,
      align: "center",
    });
    currentX += colWidths[i];
  });

  // Reset fill color
  doc.fillColor("black");

  // Draw header borders
  doc.rect(startX, currentY, tableWidth, headerHeight).stroke();

  currentY += headerHeight;

  // ========== DRAW ROWS ==========
  doc.font("Helvetica").fontSize(9);

  rows.forEach((row, rowIndex) => {
    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.rect(startX, currentY, tableWidth, rowHeight).fill("#F5F5F5");
      doc.fillColor("black");
    }

    currentX = startX;
    row.forEach((cell, colIndex) => {
      // Draw cell border
      doc.rect(currentX, currentY, colWidths[colIndex], rowHeight).stroke();

      // Draw cell text
      doc.text(String(cell), currentX + 5, currentY + 7, {
        width: colWidths[colIndex] - 10,
        align: colIndex === 0 ? "left" : "center",
      });

      currentX += colWidths[colIndex];
    });

    currentY += rowHeight;

    // Add new page if needed
    if (currentY > doc.page.height - 50) {
      doc.addPage();
      currentY = 50;
      // Redraw headers on new page
      drawProfessionalTableHeaders(doc, headers, startX, colWidths, currentY);
      currentY += headerHeight;
    }
  });

  doc.y = currentY + 10;
};

// Add to service layer
const getDetailedReports = async (employee_id, start_date, end_date) => {
  const result = await pool.query(
    `SELECT
      m.id,
      m.employee_id,
      e.employee_code,
      e.first_name || ' ' || e.last_name AS employee_name,
      m.work_date,
      m.task,
      m.hours,
      m.remarks,
      COALESCE((
        SELECT al.action
        FROM approval_logs al
        WHERE al.request_type = 'MAN_HOUR'
          AND al.request_id = m.id
        ORDER BY al.created_at DESC
        LIMIT 1
      ), 'SUBMITTED') AS status,
      d.time_from,
      d.time_to,
      d.activity
    FROM man_hour_reports m
    JOIN employees e ON e.id = m.employee_id
    LEFT JOIN man_hour_report_details d ON d.report_id = m.id
    WHERE m.employee_id = $1
      AND m.work_date BETWEEN $2 AND $3
    ORDER BY m.work_date ASC, d.time_from ASC`,
    [employee_id, start_date, end_date],
  );

  return result.rows;
};

// Helper function to format date for meta
const formatDateForMeta = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

// ==========================================
// EMPLOYEE CONTROLLERS
// ==========================================
const createManHourReport = async (req, res) => {
  try {
    const employee_id = req.user.employee_id;
    const employeeName =
      req.user.name || `${req.user.first_name} ${req.user.last_name}`;

    const data = await manHourReportService.createManHourReport(
      employee_id,
      req.body,
    );

    // Notify approvers (same as before)
    const adminUsers = await pool.query(
      `SELECT DISTINCT u.id
       FROM users u
       WHERE u.role IN ('ADMIN', 'HR_ADMIN', 'HR')`,
    );

    const assignedApprovers = await pool.query(
      `SELECT ea.approver_id
       FROM employee_approvers ea
       WHERE ea.employee_id = $1 AND (ea.approval_type = 'MAN_HOUR' OR ea.approval_type = 'ALL')`,
      [employee_id],
    );

    const approverIds = [
      ...adminUsers.rows.map((r) => r.id),
      ...assignedApprovers.rows.map((r) => r.approver_id),
    ];

    const uniqueApproverIds = [...new Set(approverIds)];

    for (const approverId of uniqueApproverIds) {
      await notificationService.notify({
        user_id: approverId,
        type: "MAN_HOUR",
        title: "New Man Hour Report",
        message: `${employeeName} submitted a man hour report with ${req.body.details?.length || 1} activities`,
        reference_id: data.id,
        meta: {
          man_hour_id: data.id,
          status: "SUBMITTED",
          employee_name: employeeName,
          work_date: formatDateForMeta(req.body.work_date),
          total_hours: data.hours,
          activities_count: req.body.details?.length || 1,
        },
      });
    }

    res.json({ message: "Man hour report submitted successfully", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyManHourReports = async (req, res) => {
  try {
    const employee_id = req.user.employee_id;
    const { page = 1, limit = 10, search = "", status = "" } = req.query;

    const data = await manHourReportService.getMyManHourReports(
      employee_id,
      page,
      limit,
      search,
      status,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateManHourReport = async (req, res) => {
  try {
    const { id } = req.params;
    const employee_id = req.user.employee_id;

    const data = await manHourReportService.updateManHourReport(
      id,
      employee_id,
      req.body,
    );

    res.json({ message: "Man hour report updated successfully", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteManHourReport = async (req, res) => {
  try {
    const { id } = req.params;
    const employee_id = req.user.employee_id;
    const userRole = req.user.role;

    await manHourReportService.deleteManHourReport(id, employee_id, userRole);

    res.json({ message: "Man hour report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// ADMIN/HR CONTROLLERS
// ==========================================

const getAllManHourReports = async (req, res) => {
  try {
    let user_id = req.user?.id;
    const userRole = req.user?.role;

    if (user_id === "" || user_id === undefined || user_id === null) {
      user_id = null;
    } else {
      user_id = Number(user_id);
      if (isNaN(user_id)) user_id = null;
    }

    const { page = 1, limit = 10, search = "", date = "" } = req.query;

    const data = await manHourReportService.getAllManHourReports(
      user_id,
      page,
      limit,
      search,
      date,
      userRole,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getManHourReportDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let user_id = req.user?.id;

    if (user_id === "" || user_id === undefined || user_id === null) {
      user_id = null;
    } else {
      user_id = Number(user_id);
      if (isNaN(user_id)) user_id = null;
    }

    const data = await manHourReportService.getManHourReportDetails(
      id,
      user_id,
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveManHourReport = async (req, res) => {
  try {
    const { id } = req.params;
    const approver_id = req.user.id;
    const userRole = req.user.role;
    const { comment } = req.body;

    const data = await manHourReportService.approveManHourReport(
      id,
      approver_id,
      comment,
      userRole,
    );

    const report = await manHourReportService.getManHourReportDetails(id);
    await notificationService.notify({
      user_id: report.employee_id,
      type: "MAN_HOUR",
      title: "Man Hour Report Approved",
      message: "Your man hour report has been approved",
      reference_id: id,
      meta: {
        man_hour_id: id,
        status: "APPROVED",
        work_date: report.work_date,
        hours: report.hours,
      },
    });

    res.json({ message: "Man hour report approved", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectManHourReport = async (req, res) => {
  try {
    const { id } = req.params;
    const approver_id = req.user.id;
    const userRole = req.user.role;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const data = await manHourReportService.rejectManHourReport(
      id,
      approver_id,
      reason,
      userRole,
    );

    const report = await manHourReportService.getManHourReportDetails(id);
    await notificationService.notify({
      user_id: report.employee_id,
      type: "MAN_HOUR",
      title: "Man Hour Report Rejected",
      message: "Your man hour report was not approved",
      reference_id: id,
      meta: {
        man_hour_id: id,
        status: "REJECTED",
        work_date: report.work_date,
        hours: report.hours,
        reason: reason,
      },
    });

    res.json({ message: "Man hour report rejected", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// SUMMARY/REPORTING CONTROLLERS
// ==========================================

const getManHourSummary = async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ message: "start_date and end_date are required" });
    }

    const data = await manHourReportService.getManHourSummary(
      start_date,
      end_date,
      employee_id,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// APPROVER CHECK
// ==========================================

const isApprover = async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await manHourReportService.isApprover(user_id);
    res.json({ isApprover: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMissingManHourDates = async (req, res) => {
  try {
    const employee_id = req.user.employee_id;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        message: "start_date and end_date are required",
      });
    }

    const data = await manHourReportService.getMissingManHourDates(
      employee_id,
      start_date,
      end_date,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createManHourReport,
  getMyManHourReports,
  getAllManHourReports,
  getManHourReportDetails,
  approveManHourReport,
  rejectManHourReport,
  getManHourSummary,
  updateManHourReport,
  deleteManHourReport,
  isApprover,
  getMissingManHourDates,
  downloadManHourReports,
  getDetailedReports,
};
