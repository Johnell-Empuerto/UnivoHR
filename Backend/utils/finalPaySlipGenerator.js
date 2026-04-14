const puppeteer = require("puppeteer");
const finalPaySlipTemplate = require("./finalPaySlipTemplate");

const generateFinalPaySlip = async (res, data) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Set HTML content
  const html = await finalPaySlipTemplate(data);
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
    `attachment; filename=final-pay-${data.employee_code}.pdf`,
  );
  res.send(pdf);
};

module.exports = { generateFinalPaySlip };
