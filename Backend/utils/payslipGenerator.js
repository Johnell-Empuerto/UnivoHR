// utils/payslipGenerator.js
const puppeteer = require("puppeteer");
const payslipTemplate = require("./payslipTemplate");

const generatePayslip = async (res, data) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const html = await payslipTemplate(data);
    await page.setContent(html, { waitUntil: "networkidle0" });

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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payslip-${data.employee_code}.pdf`,
    );
    res.send(pdf);
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = { generatePayslip };
