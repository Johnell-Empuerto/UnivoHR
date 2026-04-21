const puppeteer = require("puppeteer");
const manhourTemplate = require("./manhourTemplate");

const generateManhourPDF = async (res, exportData) => {
  let browser = null;

  try {
    // Launch puppeteer
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
      headless: "new",
    });

    const page = await browser.newPage();

    // Generate HTML from template
    const html = await manhourTemplate(exportData);

    // Set content with network idle wait
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div>
          
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 8px; text-align: center; width: 100%; color: #666; padding-bottom: 5px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
    });

    await browser.close();

    // Set response headers
    const fileName = `manhour_report_${exportData.filters.start_date}_to_${exportData.filters.end_date}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", pdf.length);

    res.send(pdf);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    if (browser) await browser.close();
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

module.exports = { generateManhourPDF };
