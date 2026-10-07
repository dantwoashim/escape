import { test, expect, devices, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const EVID = path.resolve("evidence", "mobile");
fs.mkdirSync(EVID, { recursive: true });
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(EVID, `${name}.png`), animations: "disabled" });

test.use({ ...devices["Pixel 5"], viewport: { width: 390, height: 844 } });

const tap = (page: Page, sel: string) => page.locator(sel).last().tap();
const back = (page: Page) => page.locator(".m-back:visible").tap();

async function longPress(page: Page, sel: string) {
  const bb = await page.locator(sel).last().boundingBox();
  if (!bb) throw new Error(`no ${sel}`);
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.up();
}

async function skipCoach(page: Page) {
  const coach = page.locator(".coach");
  if (await coach.count()) await coach.locator(".skip").tap();
}

test("level 1 full playthrough on a phone", async ({ page }) => {
  await page.goto("/");
  await shot(page, "landing");
  await page.fill("#team", "Team Mobile");
  await page.locator('.level-card[data-level="1"]').tap();
  await page.getByText("Start the hunt").tap();
  await skipCoach(page);
  await shot(page, "desktop");

  await tap(page, '[data-desk="box-root"]');
  await expect(page.locator(".m-appbar")).toBeVisible();
  await tap(page, '[data-file="start-here"]');
  await expect(page.locator(".word")).toBeVisible();
  await page.getByRole("button", { name: "Select all" }).tap();
  await expect(page.locator(".page")).toContainText("JR ZKHUH SHRSOH UHVW");
  await shot(page, "word-toolbar");
  await back(page); // closes the doc, explorer is back on top

  await tap(page, '[data-file="chautari"]');
  await page.locator('.view-switch button[title="Details"]').tap();
  await page.locator('.nav-btn[aria-label="Sort"]').tap();
  await page.locator('.action-sheet .sheet-item', { hasText: "Date modified" }).tap();
  await expect(page.locator(".m-rows .mrow").first()).toContainText("leaf 17");
  await shot(page, "explorer-details");
  await tap(page, '[data-file="leaf-17"]');
  await expect(page.locator(".window .word").last()).toContainText("MOMO + MOMO + MOMO = 30");
  await back(page);

  await tap(page, '[data-file="fork"]');
  await page.fill('.pw-dialog input', "42");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("Shepherd B");
  await back(page);

  await tap(page, '[data-file="shepherd-a"]');
  await tap(page, '[data-file="hajuramas-picture"]');
  await expect(page.locator(".designer")).toBeVisible();
  await shot(page, "designer");
  await page.locator('.dg-el[data-el="basket"]').tap();
  await page.getByRole("button", { name: "Send to back" }).tap();
  await expect(page.locator(".designer")).toContainText("pen cost");
  await back(page); // designer closes, explorer stays in Shepherd A

  // recycle bin: long-press -> restore
  await back(page); await back(page); await back(page); // to desktop via explorer root then close
  await expect(page.locator(".desk-icons")).toBeVisible();
  await tap(page, '[data-desk="recycle-bin"]');
  await longPress(page, '[data-file="last-page"]');
  await shot(page, "action-sheet");
  await page.locator('.action-sheet .sheet-item', { hasText: "Restore" }).tap();
  await back(page); // close bin

  await tap(page, '[data-desk="box-root"]');
  await tap(page, '[data-file="chautari"]');
  await tap(page, '[data-file="shepherd-a"]');
  await tap(page, '[data-file="last-page"]');
  await expect(page.locator(".window .word").last()).toContainText("Tenzing");
  await back(page);

  await tap(page, '[data-file="final-code"]');
  await page.fill('.pw-dialog input', "1953");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("IFXMFNS");
  await back(page);

  await back(page); await back(page); // up to the box root
  await tap(page, '[data-file="box"]');
  await page.fill('.pw-dialog input', "DASHAIN");
  await page.keyboard.press("Enter");

  const offer = page.locator('.prize-card[data-stage="offer"]');
  await expect(offer).toBeVisible({ timeout: 8000 });
  await offer.getByText("Not now").tap();
  await page.getByRole("button", { name: "Open my real gift" }).tap();
  await expect(page.locator(".finale")).toContainText("With love, Hajurama");
  await expect(page.locator(".finale")).toContainText("Passed");
  await shot(page, "finale");

  // calculator sanity on a phone-sized window
  await page.locator(".finale").waitFor({ state: "visible" });
});

test("hidden runs match the page background and body text is 15px", async ({ page }) => {
  await page.goto("/");
  await page.fill("#team", "M");
  await page.getByText("Start the hunt").tap();
  await skipCoach(page);
  await tap(page, '[data-desk="box-root"]');
  await tap(page, '.window:visible [data-file="start-here"]');
  await expect(page.locator(".window:visible .word")).toBeVisible();
  const m = await page.evaluate(() => {
    const pageEl = [...document.querySelectorAll<HTMLElement>(".window .page")]
      .find((p) => p.offsetParent !== null)!;
    const runs = [...pageEl.querySelectorAll<HTMLElement>("[data-run]")];
    const hidden = runs.find((s) => s.textContent?.includes("Secret code"));
    return {
      bg: getComputedStyle(pageEl).backgroundColor,
      hiddenColor: hidden ? getComputedStyle(hidden).color : null,
      sizes: [...new Set(runs.map((s) => getComputedStyle(s).fontSize))],
    };
  });
  // hidden text is exactly the page background: invisible by construction
  expect(m.hiddenColor).toBe("rgb(255, 253, 248)");
  expect(m.hiddenColor).toBe(m.bg);
  // every run lands in the two native bands (15px body, 19px display)
  expect(m.sizes.every((s) => s === "15px" || s === "19px")).toBe(true);
});

test("browser back steps through the shell and never leaves", async ({ page }) => {
  await page.goto("/");
  await page.fill("#team", "M");
  await page.getByText("Start the hunt").tap();
  await skipCoach(page);
  const url = page.url();

  await tap(page, '[data-desk="box-root"]');                       // explorer opens
  await tap(page, '.window:visible [data-file="chautari"]');       // into the folder
  await tap(page, '.window:visible [data-file="leaf-17"]');        // the leaf doc opens
  await expect(page.locator(".window:visible .word")).toBeVisible();

  await page.goBack(); // leaf closes, explorer still in Chautari
  await expect(page.locator(".window:visible .explorer")).toBeVisible();
  await expect(page.locator('.window:visible [data-file="leaf-17"]')).toBeVisible();

  await page.goBack(); // up one folder, back at the box root
  await expect(page.locator('.window:visible [data-file="start-here"]')).toBeVisible();

  await page.goBack(); // explorer closes, desktop again
  await expect(page.locator(".m-appbar:visible")).toHaveCount(0);
  await expect(page.locator('[data-desk="box-root"]:visible')).toBeVisible();

  await page.goBack(); // trapped at the desktop, never leaves the page
  await expect(page.locator('[data-desk="box-root"]:visible')).toBeVisible();
  await expect(page.locator(".m-appbar:visible")).toHaveCount(0);
  expect(page.url()).toBe(url);
});

test("calculator fits a phone", async ({ page }) => {
  await page.goto("/");
  await page.fill("#team", "T");
  await page.getByText("Start the hunt").tap();
  await skipCoach(page);
  await tap(page, '[data-desk="calculator"]');
  await shot(page, "calculator");
  await expect(page.locator(".calc-key").first()).toBeVisible();
});
