// utils/payslipGenerator.js
const puppeteer = require("puppeteer");
const payslipTemplate = require("./payslipTemplate");

const generatePayslip = async (res, data) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Set HTML content (await the async template)
  const html = await payslipTemplate(data);
  await page.setContent(html, { waitUntil: "networkidle0" });

  // Generate PDF
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20px",
      bottom: "20px",
      left: "20px",
      right: "20px",
    },
  });

  await browser.close();

  // Send PDF
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=payslip-${data.employee_code}.pdf`,
  );
  res.send(pdf);
};

module.exports = { generatePayslip };
