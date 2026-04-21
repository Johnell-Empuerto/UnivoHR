const manhourTemplate = async (data) => {
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group details by employee
  const groupedByEmployee = data.details.reduce((acc, detail) => {
    if (!acc[detail.employee_id]) {
      acc[detail.employee_id] = {
        employee_id: detail.employee_id,
        employee_code: detail.employee_code,
        employee_name: detail.employee_name,
        reports: [],
      };
    }
    acc[detail.employee_id].reports.push(detail);
    return acc;
  }, {});

  const employees = Object.values(groupedByEmployee);

  // Calculate grand totals
  const grandTotalHours = employees.reduce((sum, emp) => {
    const empTotal = emp.reports.reduce(
      (s, r) => s + parseFloat(r.hours || 0),
      0,
    );
    return sum + empTotal;
  }, 0);

  const grandTotalReports = employees.reduce(
    (sum, emp) => sum + emp.reports.length,
    0,
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Man Hour Report</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          padding: 40px;
          color: #333;
          font-size: 12px;
          line-height: 1.5;
        }

        /* Header Section */
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #3498db;
          padding-bottom: 20px;
        }

        .header h1 {
          color: #2c3e50;
          font-size: 24px;
          margin-bottom: 10px;
        }

        .company-info {
          color: #7f8c8d;
          font-size: 11px;
          margin-top: 5px;
        }

        /* Filter Info */
        .filter-info {
          background: #ecf0f1;
          padding: 12px;
          margin-bottom: 25px;
          border-radius: 5px;
          font-size: 11px;
        }

        .filter-info p {
          margin: 3px 0;
        }

        /* Summary Section */
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #2c3e50;
          margin: 20px 0 15px 0;
          padding-left: 8px;
          border-left: 4px solid #3498db;
        }

        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          font-size: 11px;
        }

        .summary-table th {
          background: #3498db;
          color: white;
          padding: 10px;
          text-align: left;
          border: 1px solid #2980b9;
        }

        .summary-table td {
          padding: 8px 10px;
          border: 1px solid #ddd;
        }

        .summary-table tr:nth-child(even) {
          background: #f9f9f9;
        }

        /* Employee Section */
        .employee-section {
          margin-bottom: 35px;
          page-break-inside: avoid;
        }

        .employee-header {
          background: #ecf0f1;
          padding: 10px 15px;
          margin: 15px 0 10px 0;
          border-radius: 5px;
        }

        .employee-name {
          font-size: 14px;
          font-weight: bold;
          color: #2c3e50;
        }

        .employee-code {
          font-size: 11px;
          color: #7f8c8d;
          margin-left: 10px;
        }

        /* Details Table */
        .details-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }

        .details-table th {
          background: #95a5a6;
          color: white;
          padding: 8px;
          text-align: left;
          border: 1px solid #7f8c8d;
        }

        .details-table td {
          padding: 6px 8px;
          border: 1px solid #ddd;
        }

        .details-table tr:nth-child(even) {
          background: #f9f9f9;
        }

        /* Status Badges */
        .status-approved {
          color: #27ae60;
          font-weight: bold;
        }

        .status-rejected {
          color: #e74c3c;
          font-weight: bold;
        }

        .status-submitted {
          color: #f39c12;
          font-weight: bold;
        }

        /* Total Row */
        .employee-total {
          text-align: right;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 2px solid #ddd;
          font-weight: bold;
          font-size: 11px;
        }

        /* Grand Total */
        .grand-total {
          margin-top: 30px;
          padding: 15px;
          background: #ecf0f1;
          border-radius: 5px;
          text-align: right;
          font-weight: bold;
          font-size: 13px;
        }

        /* Footer */
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 9px;
          color: #95a5a6;
        }

        /* Page Break */
        .page-break {
          page-break-before: always;
        }

        /* Activity text wrap */
        .activity-cell {
          max-width: 250px;
          word-wrap: break-word;
          white-space: normal;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <h1>MAN HOUR REPORT</h1>
        <div class="company-info">
          Generated: ${formatDateTime(data.filters.generated_at)}
        </div>
      </div>

      <!-- Filter Information -->
      <div class="filter-info">
        <p><strong>Report Period:</strong> ${formatDate(data.filters.start_date)} to ${formatDate(data.filters.end_date)}</p>
        <p><strong>Employee Filter:</strong> ${data.filters.employee_id === "All Employees" ? "All Employees" : `Employee ID: ${data.filters.employee_id}`}</p>
        <p><strong>Total Employees:</strong> ${employees.length}</p>
        <p><strong>Total Reports:</strong> ${grandTotalReports}</p>
        <p><strong>Total Hours:</strong> ${grandTotalHours.toFixed(2)} hrs</p>
      </div>

      <!-- Summary Section -->
      <div class="section-title">SUMMARY</div>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Employee Code</th>
            <th>Employee Name</th>
            <th>Total Reports</th>
            <th>Total Hours</th>
          </tr>
        </thead>
        <tbody>
          ${data.summary
            .map(
              (s) => `
            <tr>
              <td>${s.employee_code || "N/A"}</td>
              <td>${s.employee_name || "N/A"}</td>
              <td>${s.total_reports || 0}</td>
              <td>${(parseFloat(s.total_hours) || 0).toFixed(2)} hrs</td>
            </tr>
          `,
            )
            .join("")}
          ${data.summary.length === 0 ? '<tr><td colspan="4" style="text-align: center;">No data found</td></tr>' : ""}
        </tbody>
      </table>

      <!-- Detailed Report Section -->
      <div class="section-title">DETAILED REPORT</div>
      
      ${employees
        .map((employee, idx) => {
          const employeeTotalHours = employee.reports.reduce(
            (sum, r) => sum + parseFloat(r.hours || 0),
            0,
          );

          return `
            <div class="employee-section">
              <div class="employee-header">
                <span class="employee-name">${employee.employee_name || "N/A"}</span>
                <span class="employee-code">(${employee.employee_code || "N/A"})</span>
              </div>
              
              <table class="details-table">
                <thead>
                  <tr>
                    <th width="12%">Date</th>
                    <th width="8%">Hours</th>
                    <th width="12%">Status</th>
                    <th width="35%">Activity / Task</th>
                    <th width="15%">Time Range</th>
                    <th width="18%">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${employee.reports
                    .map((r) => {
                      const status = (r.status || "SUBMITTED").toUpperCase();
                      const statusClass =
                        status === "APPROVED"
                          ? "status-approved"
                          : status === "REJECTED"
                            ? "status-rejected"
                            : "status-submitted";

                      const timeRange =
                        r.time_from && r.time_to
                          ? `${r.time_from} - ${r.time_to}`
                          : r.time_from || r.time_to || "—";

                      return `
                        <tr>
                          <td>${new Date(r.work_date).toISOString().split("T")[0]}</td>
                          <td>${parseFloat(r.hours || 0).toFixed(2)}</td>
                          <td class="${statusClass}">${status}</td>
                          <td class="activity-cell">${(r.activity || r.task || "—").substring(0, 60)}</td>
                          <td>${timeRange}</td>
                          <td class="activity-cell">${(r.remarks || "—").substring(0, 40)}</td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
              
              <div class="employee-total">
                Total Hours: ${employeeTotalHours.toFixed(2)} hrs
              </div>
            </div>
          `;
        })
        .join("")}
      
      <!-- Grand Total -->
      <div class="grand-total">
        GRAND TOTAL: ${grandTotalHours.toFixed(2)} hours across ${grandTotalReports} report(s)
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p>This is a system-generated report. Please contact HR for any discrepancies.</p>
        <p>© ${new Date().getFullYear()} - Man Hour Report System</p>
      </div>
    </body>
    </html>
  `;
};

module.exports = manhourTemplate;
