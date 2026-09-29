import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

test.use({ viewport: { width: 1920, height: 1080 } });
const EVID = path.resolve("evidence");
fs.mkdirSync(EVID, { recursive: true });
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(EVID, `${name}-1920.png`), animations: "disabled" });

async function dbl(page: Page, id: string) {
  const el = page.locator(`[data-file="${id}"]`).last();
  await el.scrollIntoViewIfNeeded();
  await el.dblclick();
}

test("1920x1080 screenshots", async ({ page }) => {
  await page.goto("/");
  await shot(page, "landing");
  await page.fill("#team", "Team Peepal");
  await page.click("text=Start the hunt");
  const coach = page.locator(".coach");
  if (await coach.count()) await coach.locator(".skip").click();
  await shot(page, "desktop");

  await page.locator('[data-desk="box-root"]').dblclick();
  await shot(page, "explorer");
  await dbl(page, "start-here");
  await page.locator(".window .word .page").first().click();
  await page.keyboard.press("Control+a");
  await page.waitForTimeout(200);
  await shot(page, "word-selectall");

  // designer
  await page.locator(".window").last().locator(".tb-btn.close").click();
  await dbl(page, "chautari");
  await page.locator('.view-switch button[title="Details"]').click();
  await page.locator('th[data-col="modified"]').click();
  await shot(page, "explorer-details");
  await dbl(page, "shepherd-a");
  await dbl(page, "hajuramas-picture");
  await expect(page.locator(".designer")).toBeVisible();
  await shot(page, "designer");

  // password dialog
  await page.locator(".window").last().locator(".tb-btn.close").click();
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await dbl(page, "fork");
  await expect(page.locator(".pw-dialog")).toBeVisible();
  await shot(page, "password-dialog");
  await page.fill('.pw-dialog input', "42");
  await page.keyboard.press("Enter");
  await page.locator(".window").last().locator(".tb-btn.close").click();

  // recycle bin
  await page.click(".start-btn");
  await page.click(".sm-item:has-text('Recycle Bin')");
  await shot(page, "recycle-bin");
  await page.locator(".window").last().locator(".tb-btn.close").click();

  // finale: open BOX with DASHAIN
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await dbl(page, "box");
  await page.fill('.pw-dialog input', "DASHAIN");
  await page.keyboard.press("Enter");
  await expect(page.locator(".finale")).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1500);
  await shot(page, "finale");
});
