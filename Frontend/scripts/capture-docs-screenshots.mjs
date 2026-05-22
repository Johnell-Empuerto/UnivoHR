/**
 * Capture all UnivoHR documentation screenshots with role-based logins.
 *
 * Usage (backend + frontend must be running):
 *   npm run docs:screenshots
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { docsScreenshotCaptures } from "./docs-screenshot-routes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public/docs/screenshots");

function loadEnvFile() {
  const envPath = path.resolve(__dirname, "../.env.docs-screenshots.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

const BASE_URL = (process.env.DOCS_SCREENSHOT_BASE_URL || "http://localhost:5173").replace(
  /\/$/,
  "",
);
const API_URL = (process.env.DOCS_SCREENSHOT_API_URL || "http://localhost:3003/api").replace(
  /\/$/,
  "",
);

/** Default accounts (override via .env.docs-screenshots.local) */
const ACCOUNTS = {
  admin: {
    username: process.env.DOCS_SCREENSHOT_ADMIN_USERNAME || "admin",
    password: process.env.DOCS_SCREENSHOT_ADMIN_PASSWORD || "admin123",
  },
  hr_admin: {
    username: process.env.DOCS_SCREENSHOT_HR_ADMIN_USERNAME || "emp27",
    password: process.env.DOCS_SCREENSHOT_HR_ADMIN_PASSWORD || "admin123",
  },
  employee: {
    username: process.env.DOCS_SCREENSHOT_EMPLOYEE_USERNAME || "emp50",
    password: process.env.DOCS_SCREENSHOT_EMPLOYEE_PASSWORD || "password123",
  },
};

const VIEWPORT = { width: 1440, height: 900 };
const HEADED_ON_2FA = process.env.DOCS_SCREENSHOT_HEADED_ON_2FA === "1";

const results = { ok: [], fail: [] };

function logOk(id, detail = "") {
  results.ok.push(id);
  console.log(`  ✓ SUCCESS  ${id}.png${detail ? ` — ${detail}` : ""}`);
}

function logFail(id, reason) {
  results.fail.push({ id, reason });
  console.error(`  ✗ FAILED   ${id}.png — ${reason}`);
}

class TwoFactorRequiredError extends Error {
  constructor(username) {
    super(
      `2FA is enabled for "${username}". Disable "enable_2fa_login_email" in System Settings, then re-run: npm run docs:screenshots`,
    );
    this.name = "TwoFactorRequiredError";
  }
}

async function apiLogin(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `Login API non-JSON (HTTP ${res.status}). Is backend running at ${API_URL}?`,
    );
  }

  if (!res.ok) {
    throw new Error(data?.message || `Login failed (HTTP ${res.status})`);
  }

  if (data.requires_2fa) {
    throw new TwoFactorRequiredError(username);
  }

  if (!data.token) {
    throw new Error("Login returned no token");
  }

  return data.token;
}

async function waitForAppReady(page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 60_000 });
  await page
    .waitForFunction(
      () => document.querySelectorAll(".animate-spin").length === 0,
      { timeout: 45_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(1200);
}

async function detect2FAOnPage(page) {
  const has2FA = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    return (
      text.includes("Verification code") ||
      text.includes("Enter the 6-digit") ||
      text.includes("OTP") ||
      !!document.querySelector("input[maxlength='6']")
    );
  });
  return has2FA;
}

async function injectToken(page, token) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate((t) => localStorage.setItem("token", t), token);
}

async function removeHighlights(page) {
  await page.evaluate(() => {
    document.querySelectorAll("[data-docs-highlight]").forEach((el) => el.remove());
    document.getElementById("docs-highlight-style")?.remove();
    document.getElementById("docs-highlight-svg")?.remove();
  });
}

async function applyHighlights(page, highlights = []) {
  await removeHighlights(page);
  if (!highlights.length) return;

  await page.evaluate((items) => {
    const style = document.createElement("style");
    style.id = "docs-highlight-style";
    style.textContent = `
      .docs-hl-ring {
        position: fixed;
        border: 3px solid #ef4444;
        border-radius: 10px;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.35);
        z-index: 99999;
        pointer-events: none;
      }
      .docs-hl-label {
        position: fixed;
        background: #ef4444;
        color: #fff;
        font: 700 13px/1.2 system-ui, sans-serif;
        padding: 6px 10px;
        border-radius: 6px;
        z-index: 100001;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
    `;
    document.head.appendChild(style);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "docs-highlight-svg";
    svg.setAttribute(
      "style",
      "position:fixed;inset:0;width:100%;height:100%;z-index:100000;pointer-events:none",
    );
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "docs-arrow");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "6");
    marker.setAttribute("refY", "3");
    marker.setAttribute("orient", "auto");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M0,0 L0,6 L6,3 z");
    path.setAttribute("fill", "#ef4444");
    marker.appendChild(path);
    defs.appendChild(marker);
    svg.appendChild(defs);
    document.body.appendChild(svg);

    const pick = (selector) => {
      for (const part of selector.split(",").map((s) => s.trim())) {
        const el = document.querySelector(part);
        if (el) return el;
      }
      return null;
    };

    items.forEach((item) => {
      const el = pick(item.selector);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      const ring = document.createElement("div");
      ring.className = "docs-hl-ring";
      ring.setAttribute("data-docs-highlight", "1");
      ring.style.top = `${rect.top - 6}px`;
      ring.style.left = `${rect.left - 6}px`;
      ring.style.width = `${rect.width + 12}px`;
      ring.style.height = `${rect.height + 12}px`;
      document.body.appendChild(ring);

      if (item.label) {
        const label = document.createElement("div");
        label.className = "docs-hl-label";
        label.setAttribute("data-docs-highlight", "1");
        label.textContent = `→ ${item.label}`;
        const labelTop = Math.max(8, rect.top - 36);
        const labelLeft = Math.min(
          window.innerWidth - 160,
          rect.left + rect.width / 2 - 40,
        );
        label.style.top = `${labelTop}px`;
        label.style.left = `${labelLeft}px`;
        document.body.appendChild(label);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("data-docs-highlight", "1");
        line.setAttribute("x1", String(labelLeft + 50));
        line.setAttribute("y1", String(labelTop + 28));
        line.setAttribute("x2", String(rect.left + rect.width / 2));
        line.setAttribute("y2", String(rect.top + 4));
        line.setAttribute("stroke", "#ef4444");
        line.setAttribute("stroke-width", "3");
        line.setAttribute("marker-end", "url(#docs-arrow)");
        svg.appendChild(line);
      }
    });
  }, highlights);

  await page.waitForTimeout(400);
}

async function assertAuthenticated(page, cap) {
  const url = page.url();
  if (cap.auth === "none") return;

  if (url.includes("/login")) {
    throw new Error("Redirected to /login — session expired or login failed");
  }

  if (await detect2FAOnPage(page)) {
    throw new TwoFactorRequiredError("(detected OTP screen in browser)");
  }
}

async function captureOne(page, cap) {
  const filename = `${cap.id}.png`;
  const url = `${BASE_URL}${cap.route}`;
  console.log(`  → ${url} (${cap.auth})`);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await waitForAppReady(page);
  await assertAuthenticated(page, cap);
  await applyHighlights(page, cap.highlights || []);

  const outPath = path.join(OUT_DIR, filename);
  await page.screenshot({
    path: outPath,
    fullPage: true,
    animations: "disabled",
  });

  await removeHighlights(page);

  if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 1000) {
    throw new Error("Screenshot file missing or too small");
  }
}

async function loginRole(role) {
  const creds = ACCOUNTS[role];
  if (!creds?.username || !creds?.password) {
    throw new Error(`Missing credentials for role: ${role}`);
  }
  console.log(`\n🔐 Logging in as ${role}: ${creds.username}`);
  const token = await apiLogin(creds.username, creds.password);
  return token;
}

async function captureGroup(page, captures, primaryRole, tokens) {
  const label =
    primaryRole === "admin"
      ? "ADMIN"
      : primaryRole === "employee"
        ? "EMPLOYEE"
        : "PUBLIC";

  console.log(`\n📸 ${label} screenshots (${captures.length})`);

  if (primaryRole !== "none") {
    await injectToken(page, tokens[primaryRole]);
  }

  for (const cap of captures) {
    try {
      if (cap.auth === "admin" && primaryRole === "admin") {
        try {
          await captureOne(page, cap);
          logOk(cap.id);
        } catch (adminErr) {
          if (
            adminErr instanceof TwoFactorRequiredError ||
            !tokens.hr_admin
          ) {
            throw adminErr;
          }
          console.log(`    ↻ Retrying ${cap.id} with HR_ADMIN (emp27)...`);
          await injectToken(page, tokens.hr_admin);
          await captureOne(page, cap);
          logOk(cap.id, "via HR_ADMIN fallback");
        }
      } else {
        await captureOne(page, cap);
        logOk(cap.id);
      }
    } catch (err) {
      logFail(cap.id, err.message);
    }
  }
}

async function handle2FAPause(browser, err) {
  console.error("\n" + "=".repeat(72));
  console.error("⛔ 2FA MUST BE DISABLED FOR SCREENSHOT CAPTURE");
  console.error("=".repeat(72));
  console.error(err.message);
  console.error("\nSteps:");
  console.error("  1. Log in as ADMIN in the app.");
  console.error("  2. Open Settings → disable login email OTP (enable_2fa_login_email).");
  console.error("  3. Re-run: npm run docs:screenshots");
  console.error("=".repeat(72));

  if (HEADED_ON_2FA) {
    console.error("\nOpening browser (paused). Press Resume in Playwright Inspector after disabling 2FA...");
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.pause();
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const publicCaps = docsScreenshotCaptures.filter((c) => c.auth === "none");
  const adminCaps = docsScreenshotCaptures.filter((c) => c.auth === "admin");
  const employeeCaps = docsScreenshotCaptures.filter((c) => c.auth === "employee");

  console.log("UnivoHR documentation screenshot capture");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API URL:  ${API_URL}`);
  console.log(`Output:   ${OUT_DIR}`);
  console.log(`Accounts: admin=${ACCOUNTS.admin.username}, hr_admin=${ACCOUNTS.hr_admin.username}, employee=${ACCOUNTS.employee.username}`);

  const browser = await chromium.launch({ headless: !HEADED_ON_2FA });

  try {
    const tokens = {};

    try {
      tokens.admin = await loginRole("admin");
    } catch (err) {
      if (err instanceof TwoFactorRequiredError) {
        await handle2FAPause(browser, err);
        process.exit(1);
      }
      throw err;
    }

    try {
      tokens.hr_admin = await loginRole("hr_admin");
    } catch (err) {
      if (err instanceof TwoFactorRequiredError) {
        await handle2FAPause(browser, err);
        process.exit(1);
      }
      console.warn(`  ⚠ HR_ADMIN login failed (admin fallback only): ${err.message}`);
    }

    try {
      tokens.employee = await loginRole("employee");
    } catch (err) {
      if (err instanceof TwoFactorRequiredError) {
        await handle2FAPause(browser, err);
        process.exit(1);
      }
      throw new Error(`EMPLOYEE login required but failed: ${err.message}`);
    }

    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      colorScheme: "light",
    });
    const page = await context.newPage();

    await captureGroup(page, publicCaps, "none", tokens);
    await captureGroup(page, adminCaps, "admin", tokens);

    console.log("\n🔐 Switching to EMPLOYEE session");
    await injectToken(page, tokens.employee);
    await captureGroup(page, employeeCaps, "employee", tokens);

    await context.close();

    const expected = docsScreenshotCaptures.map((c) => c.id);
    const missing = expected.filter((id) => !results.ok.includes(id));

    console.log("\n" + "=".repeat(72));
    console.log("SUMMARY");
    console.log("=".repeat(72));
    console.log(`Succeeded: ${results.ok.length} / ${expected.length}`);
    results.ok.forEach((id) => console.log(`  ✓ ${id}.png`));

    if (results.fail.length) {
      console.log(`\nFailed: ${results.fail.length}`);
      results.fail.forEach(({ id, reason }) =>
        console.log(`  ✗ ${id}.png — ${reason}`),
      );
    }

    if (missing.length) {
      console.error("\nMissing screenshots — /docs will show fallback for:");
      missing.forEach((id) => console.error(`  - ${id}.png`));
      process.exitCode = 1;
    } else {
      console.log("\nAll screenshots captured. Open /docs to view them.");
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
