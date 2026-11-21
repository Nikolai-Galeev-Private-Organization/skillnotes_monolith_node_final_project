const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const marked = require("marked");
const path = require("path");

async function getBrowserOptions() {
  // На Vercel / Linux используем @sparticuz/chromium
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    const executablePath = await chromium.executablePath();
    const execDir = path.dirname(executablePath);

    // Критически важно для Vercel: путь к системным библиотекам
    process.env.LD_LIBRARY_PATH = execDir;

    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
    };
  }

  // Локально на Windows используем установленный Chrome или Edge
  return {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
  };
}

async function generatePdfBuffer(title, markdown) {
  const html = `<!DOCTYPE html>
    <html><head><meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
      h1 { font-size: 26px; border-bottom: 2px solid #333; padding-bottom: 8px; }
      pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
      code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
      blockquote { border-left: 4px solid #ccc; margin-left: 0; padding-left: 12px; color: #555; }
    </style></head>
    <body><h1>${title}</h1>${marked.parse(markdown)}</body></html>`;

  // Получаем правильные опции для текущей среды (Vercel или Windows)
  const options = await getBrowserOptions();

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const buffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm" },
  });
  await browser.close();
  return buffer;
}

module.exports = { generatePdfBuffer };
