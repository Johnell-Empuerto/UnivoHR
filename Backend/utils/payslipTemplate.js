const settingService = require("../services/setting.service");

const payslipTemplate = async (data) => {
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

  // LEAVE CONVERSION
  const leaveConversion = Number(data.leave_conversion || 0);

  // MONTHLY SALARY (from employee_salary table)
  const monthlySalary = Number(data.monthly_salary || data.basic_salary || 0);

  // CUTOFF SALARY (what they actually earned this period)
  const cutoffSalary = Number(data.basic_salary || 0);

  // GROSS PAY with leave conversion
  const grossPay =
    cutoffSalary + Number(data.overtime_pay || 0) + leaveConversion;

  // SAFE PARSE RULES
  const getSafeRules = () => {
    if (!data.rule_snapshot) return null;
    try {
      return typeof data.rule_snapshot === "string"
        ? JSON.parse(data.rule_snapshot)
        : data.rule_snapshot;
    } catch {
      return null;
    }
  };

  const rules = getSafeRules();

  // RULE INFO DISPLAY
  const getRuleInfo = () => {
    if (!rules) return "No rule";
    let info = "";
    if (rules.late_deduction_enabled) {
      if (rules.late_deduction_type === "FIXED") {
        info = `Fixed: ₱${rules.late_deduction_value} per late`;
      } else {
        info = `Per minute: ${rules.late_deduction_value}x rate`;
      }
      if (rules.grace_period) {
        info += ` (Grace: ${rules.grace_period} min)`;
      }
    } else {
      info = "Disabled";
    }
    return info;
  };

  //  Calculate working days info from rule_snapshot if available
  const getWorkingDaysInfo = () => {
    if (!rules) return "";
    const workingDaysInCutoff = rules.working_days_in_cutoff || 0;
    const totalWorkUnits = rules.total_work_units || 0;
    if (workingDaysInCutoff > 0) {
      return `<div style="font-size: 10px; color: #666; margin-top: 2px;">
       
      </div>`;
    }
    return "";
  };

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Payslip - ${data.employee_code}</title>

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

      .rule-info {
        font-size: 10px;
        color: #7f8c8d;
        font-style: italic;
        margin-top: 3px;
      }

      .monthly-note {
        font-size: 11px;
        color: #7f8c8d;
        margin-left: 10px;
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
        <div class="title">PAYSLIP</div>
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
          <strong>Pay Period:</strong><br/>
          ${formatDate(data.cutoff_start)} - ${formatDate(data.cutoff_end)}<br/>
          <strong>Pay Date:</strong> ${formatDate(data.pay_date)}
        </div>
      </div>

      <!-- SALARY INFO - MONTHLY VS CUTOFF -->
      <div style="background: #e8f4f8; padding: 10px 15px; border-radius: 8px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span><strong>Monthly Salary:</strong> ${formatCurrency(monthlySalary)}</span>
          <span><strong>This Cutoff:</strong> ${formatCurrency(cutoffSalary)}</span>
        </div>
        <div style="font-size: 11px; color: #555; margin-top: 5px;">
          * ${formatCurrency(cutoffSalary)} is your salary for this cutoff period based on actual work days
        </div>
      </div>

      <!-- EARNINGS -->
      <h3>EARNINGS</h3>
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
              Basic Salary (This Cutoff)
              ${getWorkingDaysInfo()}
            </td>
            <td class="text-right">${formatCurrency(cutoffSalary)}</td>
          </tr>
          
          ${
            data.overtime_pay && data.overtime_pay > 0
              ? `
          <tr>
            <td>Overtime Pay</td>
            <td class="text-right">${formatCurrency(data.overtime_pay)}</td>
          </tr>
          `
              : ""
          }

          <!-- LEAVE CONVERSION ROW -->
          ${
            leaveConversion > 0
              ? `
          <tr class="leave-conversion-row">
            
            <td class="text-right">${formatCurrency(leaveConversion)}</td>
          </tr>
          `
              : ""
          }

          <tr class="total-row">
            <td><strong>Total Earnings</strong></td>
            <td class="text-right"><strong>${formatCurrency(grossPay)}</strong></td>
          </tr>
        </tbody>
      </table>

      <!-- DEDUCTIONS -->
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

          <tr>
            <td>
              Late Deduction 
              <div class="rule-info">${getRuleInfo()}</div>
            </td>
            <td class="text-right">${formatCurrency(data.late_deduction)}</td>
          </tr>

          <tr>
            <td>Absent Deduction</td>
            <td class="text-right">${formatCurrency(data.absent_deduction)}</td>
          </tr>

          <tr class="total-row">
            <td><strong>Total Deductions</strong></td>
            <td class="text-right"><strong>${formatCurrency(data.deductions)}</strong></td>
          </tr>
        </tbody>
      </table>

      <!-- SUMMARY -->
      <div class="summary">
        <div class="summary-item">
          <span>GROSS EARNINGS</span>
          <span><strong>${formatCurrency(grossPay)}</strong></span>
        </div>
        <div class="summary-item">
          <span>TOTAL DEDUCTIONS</span>
          <span><strong>${formatCurrency(data.deductions)}</strong></span>
        </div>
        <div class="net-pay">
          <span>NET PAY</span>
          <span>${formatCurrency(data.net_salary)}</span>
        </div>
      </div>

      <!-- LEAVE CONVERSION NOTE -->
      ${
        leaveConversion > 0
          ? `
      <div style="margin-top: 20px; padding: 12px; background: #f0f9ff; border-left: 4px solid #2563eb; border-radius: 4px; font-size: 11px; color: #1e40af;">
        <strong>Leave Conversion Note:</strong> ₱${leaveConversion.toLocaleString()} from unused vacation leave conversion (max 5 days)
      </div>
      `
          : ""
      }

      <!-- FOOTER -->
      <div class="footer">
        This is a computer-generated document. No signature is required.<br/>
        For any discrepancies, please contact HR within 15 days.
      </div>

    </div>
  </body>
  </html>
  `;
};

module.exports = payslipTemplate;
