const settingService = require("../services/setting.service");

const finalPaySlipTemplate = async (data) => {
  // Get company branding settings
  const companyName = await settingService.getSetting("company_name");
  const companyAddress = await settingService.getSetting("company_address");
  const primaryColor =
    (await settingService.getSetting("primary_color")) || "#3498db";
  const showCompanyNameOnPayslip = await settingService.getBoolSetting(
    "payslip_show_company_name",
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount || 0));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Determine header display
  const headerCompanyName =
    showCompanyNameOnPayslip && companyName ? companyName : "UnivoHR";
  const headerAddress =
    showCompanyNameOnPayslip && companyAddress ? companyAddress : "";

  // Calculate totals
  const salaryUntilLastDay = Number(data.salary_until_last_day || 0);
  const leaveConversionAmount = Number(data.leave_conversion_amount || 0);
  const totalFinalPay = Number(data.total_amount || data.total_final_pay || 0);

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Final Pay Slip - ${data.employee_code}</title>

    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 30px;
        color: #333;
      }

      .container {
        max-width: 900px;
        margin: auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid ${primaryColor};
        padding-bottom: 15px;
        margin-bottom: 20px;
      }

      .company {
        font-size: 22px;
        font-weight: bold;
        color: #2c3e50;
      }

      .title {
        font-size: 28px;
        font-weight: bold;
        color: ${primaryColor};
      }

      .final-pay-badge {
        background: #fee2e2;
        color: #dc2626;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: bold;
        display: inline-block;
        margin-left: 10px;
      }

      .info-grid {
        margin-top: 20px;
        margin-bottom: 25px;
        display: flex;
        justify-content: space-between;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
      }

      .info-section {
        font-size: 12px;
        line-height: 1.6;
      }

      .info-section strong {
        color: #2c3e50;
      }

      h3 {
        color: #2c3e50;
        margin-top: 20px;
        margin-bottom: 10px;
        font-size: 16px;
        border-left: 4px solid ${primaryColor};
        padding-left: 10px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        margin-bottom: 20px;
      }

      th {
        background: #ecf0f1;
        padding: 12px;
        font-size: 13px;
        text-align: left;
        font-weight: 600;
        border: 1px solid #ddd;
      }

      td {
        padding: 10px;
        font-size: 13px;
        border: 1px solid #ddd;
      }

      .text-right {
        text-align: right;
      }

      .total-row {
        font-weight: bold;
        background: #f8f9fa;
      }

      .leave-conversion-row {
        background: #e8f4f8;
        color: #2563eb;
      }

      .summary {
        margin-top: 30px;
        border-top: 2px solid #2c3e50;
        padding-top: 15px;
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        margin: 8px 0;
        font-size: 14px;
      }

      .net-pay {
        font-size: 20px;
        font-weight: bold;
        color: #27ae60;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 2px solid #27ae60;
      }

      .separation-info {
        background: #fef3c7;
        padding: 12px 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid #f59e0b;
      }

      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 10px;
        color: #95a5a6;
        border-top: 1px solid #ecf0f1;
        padding-top: 15px;
      }
    </style>
  </head>

  <body>
    <div class="container">

      <!-- HEADER -->
      <div class="header">
        <div>
          <div class="company">${headerCompanyName}</div>
          ${headerAddress ? `<div style="font-size:11px; color:#7f8c8d;">${headerAddress}</div>` : ""}
        </div>
        <div class="title">
          FINAL PAY SLIP
          <span class="final-pay-badge">${data.status || "RESIGNED"}</span>
        </div>
      </div>

      <!-- EMPLOYEE INFO -->
      <div class="info-grid">
        <div class="info-section">
          <strong>Employee:</strong> ${data.first_name || ""} ${data.last_name || ""}<br/>
          <strong>Code:</strong> ${data.employee_code}<br/>
          <strong>TIN:</strong> ${data.tin_number || "N/A"}
        </div>

        <div class="info-section">
          <strong>SSS:</strong> ${data.sss_number || "N/A"}<br/>
          <strong>PhilHealth:</strong> ${data.philhealth_number || "N/A"}<br/>
          <strong>HDMF:</strong> ${data.hdmf_number || "N/A"}
        </div>

        <div class="info-section">
          <strong>Separation Date:</strong><br/>
          ${formatDate(data.resignation_date || data.termination_date)}<br/>
          <strong>Last Working Date:</strong> ${formatDate(data.last_working_date)}
        </div>
      </div>

      <!-- SEPARATION INFO -->
      <div class="separation-info">
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span><strong>${data.status === "RESIGNED" ? "Resignation" : "Termination"} Date:</strong> ${formatDate(data.resignation_date || data.termination_date)}</span>
          <span><strong>Last Working Date:</strong> ${formatDate(data.last_working_date)}</span>
          <span><strong>Days Worked:</strong> ${data.days_worked || 0} days</span>
        </div>
        <div style="font-size: 11px; color: #555; margin-top: 8px;">
          * Final pay calculated based on actual days worked up to last working day
        </div>
      </div>

      <!-- EARNINGS -->
      <h3>FINAL PAY EARNINGS</h3>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Salary (${data.days_worked || 0} days worked)
              <div style="font-size: 10px; color: #666; margin-top: 2px;">
                Daily rate: ${formatCurrency(data.daily_rate || 0)}
              </div>
            </td>
            <td class="text-right">${formatCurrency(salaryUntilLastDay)}</td>
          </tr>

          <!-- LEAVE CONVERSION ROW -->
          ${
            leaveConversionAmount > 0
              ? `
          <tr class="leave-conversion-row">
            <td>
              Leave Conversion 
              <div style="font-size: 10px;">(Unused vacation leave: ${data.unused_vacation_leave || 0} days)</div>
            </td>
            <td class="text-right">${formatCurrency(leaveConversionAmount)}</td>
          </tr>
          `
              : ""
          }

          <tr class="total-row">
            <td><strong>Total Final Pay Earnings</strong></td>
            <td class="text-right"><strong>${formatCurrency(salaryUntilLastDay + leaveConversionAmount)}</strong></td>
          </tr>
        </tbody>
      </table>

      <!-- DEDUCTIONS (if any) -->
      ${
        data.deductions && data.deductions > 0
          ? `
      <h3>DEDUCTIONS</h3>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.deductions_list?.length
              ? data.deductions_list
                  .map(
                    (d) => `
          <tr>
            <td>${d.type}</td>
            <td class="text-right">${formatCurrency(d.amount)}</td>
          </tr>
          `,
                  )
                  .join("")
              : ""
          }
          <tr class="total-row">
            <td><strong>Total Deductions</strong></td>
            <td class="text-right"><strong>${formatCurrency(data.deductions)}</strong></td>
          </tr>
        </tbody>
      </table>
      `
          : ""
      }

      <!-- SUMMARY -->
      <div class="summary">
        <div class="summary-item">
          <span>SALARY (${data.days_worked || 0} days)</span>
          <span><strong>${formatCurrency(salaryUntilLastDay)}</strong></span>
        </div>
        ${
          leaveConversionAmount > 0
            ? `
        <div class="summary-item">
          <span>LEAVE CONVERSION (${data.unused_vacation_leave || 0} unused days)</span>
          <span><strong>+ ${formatCurrency(leaveConversionAmount)}</strong></span>
        </div>
        `
            : ""
        }
        ${
          data.deductions && data.deductions > 0
            ? `
        <div class="summary-item">
          <span>TOTAL DEDUCTIONS</span>
          <span><strong>- ${formatCurrency(data.deductions)}</strong></span>
        </div>
        `
            : ""
        }
        <div class="net-pay">
          <span>FINAL PAY AMOUNT</span>
          <span>${formatCurrency(totalFinalPay)}</span>
        </div>
      </div>

      <!-- LEAVE CONVERSION NOTE -->
      ${
        leaveConversionAmount > 0
          ? `
      <div style="margin-top: 20px; padding: 12px; background: #f0f9ff; border-left: 4px solid #2563eb; border-radius: 4px; font-size: 11px; color: #1e40af;">
        <strong>Leave Conversion Note:</strong> ${formatCurrency(leaveConversionAmount)} from ${data.unused_vacation_leave || 0} unused vacation leave days converted to cash.
      </div>
      `
          : ""
      }

      <!-- FOOTER -->
      <div class="footer">
        This is a computer-generated final pay document. No signature is required.<br/>
        This final pay includes all salary, leave conversions, and final settlements.<br/>
        For any discrepancies, please contact HR within 15 days.
      </div>

    </div>
  </body>
  </html>
  `;
};

module.exports = finalPaySlipTemplate;
