import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// README screenshots at 1920x1080, animations settled.
test.skip(!process.env.DOCS_SHOTS, "set DOCS_SHOTS=1 to refresh the README screenshots");
test.use({ viewport: { width: 1920, height: 1080 } });
const DOCS = path.resolve("docs");
fs.mkdirSync(DOCS, { recursive: true });
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(DOCS, `${name}.png`), animations: "disabled" });

async function dbl(page: Page, id: string) {
  const el = page.locator(`[data-file="${id}"]`).last();
  await el.scrollIntoViewIfNeeded();
  await el.dblclick();
}
async function closeTopWin(page: Page) {
  const wins = page.locator(".window");
  const n = await wins.count();
  if (n === 0) return;
  let top = 0, idx = 0;
  for (let i = 0; i < n; i++) {
    const z = parseInt((await wins.nth(i).evaluate((e) => getComputedStyle(e).zIndex)) || "0");
    if (z >= top) { top = z; idx = i; }
  }
  await wins.nth(idx).locator(".tb-btn.close").click();
}

test("docs screenshots: explorer details + finale after full playthrough", async ({ page }) => {
  await page.goto("/");
  await page.fill("#team", "Team Peepal");
  await page.click("text=Start the hunt");
  const coach = page.locator(".coach");
  if (await coach.count()) await coach.locator(".skip").click();

  await page.locator('[data-desk="box-root"]').dblclick();
  await dbl(page, "start-here");
  await page.locator(".window .word .page").first().click();
  await page.keyboard.press("Control+a");
  await closeTopWin(page);

  await dbl(page, "chautari");
  await page.locator('.view-switch button[title="Details"]').click();
  await page.locator('th[data-col="modified"]').click();
  await expect(page.locator("table.details tbody tr").first()).toContainText("leaf 17");
  await shot(page, "explorer"); // docs/explorer.png — breadcrumb + sorted details

  await dbl(page, "leaf-17");
  await expect(page.locator(".window .word").last()).toContainText("MOMO + MOMO");
  await closeTopWin(page);

  await dbl(page, "fork");
  await page.fill('.pw-dialog input', "42");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("Shepherd B is lying");
  await closeTopWin(page);

  await dbl(page, "shepherd-a");
  await dbl(page, "hajuramas-picture");
  await expect(page.locator(".designer")).toBeVisible();
  const bb = await page.locator('.dg-el[data-el="basket"]').boundingBox();
  if (!bb) throw new Error("no basket");
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(bb.x + bb.width / 2 + i * 40, bb.y + bb.height / 2 + i * 8);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await closeTopWin(page);

  // recycle bin restore
  await page.click(".start-btn");
  await page.click(".sm-item:has-text('Recycle Bin')");
  await expect(page.getByRole("dialog", { name: "Recycle Bin" })).toBeVisible();
  await page.locator('[data-file="last-page"]').last().click({ button: "right" });
  await page.click(".ctx-item:has-text('Restore')");
  await closeTopWin(page);

  await dbl(page, "last-page");
  await expect(page.locator(".window .word").last()).toContainText("Tenzing Norgay");
  await closeTopWin(page);

  await dbl(page, "final-code");
  await page.fill('.pw-dialog input', "1953");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("IFXMFNS");
  await closeTopWin(page);

  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await dbl(page, "box");
  await page.fill('.pw-dialog input', "DASHAIN");
  await page.keyboard.press("Enter");
  await expect(page.locator(".finale")).toBeVisible({ timeout: 5000 });
  // refuse the fake prize so the blessing shows with the "Passed" stat
  const offer = page.locator('.prize-card[data-stage="offer"]');
  await expect(offer).toBeVisible({ timeout: 8000 });
  await offer.getByText("Not now").click();
  await page.getByRole("button", { name: "Open my real gift" }).click();
  await expect(page.locator(".finale")).toContainText("With love, Hajurama");
  await shot(page, "finale"); // docs/finale.png
});
