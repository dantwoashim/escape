import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const EVID = path.resolve("evidence");
fs.mkdirSync(EVID, { recursive: true });
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(EVID, `${name}.png`), animations: "disabled" });

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

async function startLevel2(page: Page) {
  await page.goto("/");
  await page.fill("#team", "Team Tihar");
  await page.locator('.level-card[data-level="2"]').click();
  await page.click("text=Start the hunt");
  const coach = page.locator(".coach");
  if (await coach.count()) await coach.locator(".skip").click();
}

test("level 2 full playthrough with the Facebook prank", async ({ page }) => {
  await page.goto("/");
  await page.locator('.level-card[data-level="2"]').click();
  await shot(page, "l2-landing-1366");
  await page.fill("#team", "Team Tihar");
  await page.click("text=Start the hunt");
  const coach = page.locator(".coach");
  if (await coach.count()) await coach.locator(".skip").click();
  await expect(page.locator('[data-desk="box-root"]')).toContainText("Hajurba's Radio");
  await shot(page, "l2-desktop-1366");

  await page.locator('[data-desk="box-root"]').dblclick();
  await dbl(page, "start-here");
  await page.locator(".window .word .page").first().click();
  await page.keyboard.press("Control+a");
  await expect(page.locator(".page")).toContainText("JR ZKHUH SHRSOH ZDLW");
  await closeTopWin(page);

  await dbl(page, "chautari");
  await expect(page.locator(".breadcrumb")).toContainText("Hajurba's Radio");
  await expect(page.locator(".breadcrumb")).toContainText("Bus Park");
  await page.locator('.view-switch button[title="Details"]').click();
  await page.locator('th[data-col="modified"]').click();
  await expect(page.locator("table.details tbody tr").first()).toContainText("ticket 23");
  await dbl(page, "leaf-23");
  await expect(page.locator(".window .word").last()).toContainText("SEL + SEL + SEL = 15");
  await closeTopWin(page);

  await dbl(page, "fork");
  await page.fill('.pw-dialog input', "56"); // the trap answer
  await page.keyboard.press("Enter");
  await expect(page.locator(".pw-err")).toContainText("incorrect");
  await page.fill('.pw-dialog input', "38");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("Shyam is the liar");
  await closeTopWin(page);

  await dbl(page, "shepherd-a");
  await dbl(page, "hajuramas-picture");
  await expect(page.locator(".designer")).toBeVisible();
  await shot(page, "l2-design-1366");
  const bb = await page.locator('.dg-el[data-el="basket"]').boundingBox();
  if (!bb) throw new Error("no topi");
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(bb.x + bb.width / 2 + i * 40, bb.y + bb.height / 2 + i * 8);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await expect(page.locator(".designer")).toContainText("eraser");
  await shot(page, "l2-design-after-1366");
  await closeTopWin(page);

  await page.click(".start-btn");
  await page.click(".sm-item:has-text('Recycle Bin')");
  await page.locator('[data-file="last-page"]').last().click({ button: "right" });
  await page.click(".ctx-item:has-text('Restore')");
  await closeTopWin(page);
  await dbl(page, "last-page");
  await expect(page.locator(".window .word").last()).toContainText("federal democratic republic");
  await closeTopWin(page);

  await dbl(page, "final-code");
  await page.fill('.pw-dialog input', "2008");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("XMLEV");
  await closeTopWin(page);

  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await dbl(page, "box");
  await page.fill('.pw-dialog input', "TIHAR");
  await page.keyboard.press("Enter");

  // the Facebook prank
  const offer = page.locator('.prize-card[data-stage="offer"]');
  await expect(offer).toBeVisible({ timeout: 8000 });
  await expect(offer).toContainText("facebook");
  await shot(page, "l2-prank-1366");
  await offer.getByRole("button", { name: "Log in" }).click();
  await expect(offer).toContainText("Enter your mobile number or email and password");
  const pwInput = offer.getByLabel("Password");
  await expect(pwInput).toHaveAttribute("type", "text");
  expect(await pwInput.evaluate((el) => getComputedStyle(el).getPropertyValue("-webkit-text-security"))).toBe("disc");
  await offer.getByLabel("Mobile number or email").fill("test@example.com");
  await pwInput.fill("notreal123");
  await offer.getByRole("button", { name: "Log in" }).click();
  await expect(page.locator('.prize-card[data-stage="fell"]')).toContainText("Hajurba is very disappointed");
  const stored = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  expect(stored).not.toContain("test@example.com");
  expect(stored).not.toContain("notreal123");
  await page.getByRole("button", { name: "Sorry, Hajurba" }).click();
  await expect(page.locator(".finale")).toContainText("With love, Hajurba");
  await expect(page.locator(".finale")).toContainText("You found Hajurba's radio!");
  await expect(page.locator(".finale")).toContainText("Fell for it");
});

test("level 2 traps cleared then Trap Master", async ({ page }) => {
  await startLevel2(page);
  await page.locator('[data-desk="box-root"]').dblclick();

  // Gumba: flags, Ctrl+H replace #, blessing DANPHE
  await dbl(page, "temple");
  await dbl(page, "temple-inside");
  await dbl(page, "bell");
  await dbl(page, "prayer");
  await page.locator(".window .word .page").last().click();
  await page.keyboard.press("Control+h");
  await page.fill('.fr-dialog input[aria-label="Find what"]', "#");
  await page.click('.fr-dialog button:has-text("Replace All")');
  await expect(page.locator(".toast")).toContainText("replacements");
  await expect(page.locator(".window .word").last()).toContainText("national bird of Nepal");
  await closeTopWin(page);
  await dbl(page, "blessing");
  await page.fill('.pw-dialog input', "himalayan monal");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("WKH UDGLR");
  await closeTopWin(page);
  for (let i = 0; i < 3; i++) await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();

  // Mobile Shop scam reveal
  await dbl(page, "tea-shop");
  await dbl(page, "prize");
  await page.fill('.field-row input[aria-label="SIM PIN"]', "1234");
  await page.waitForTimeout(1400);
  await expect(page.locator(".window .word").last()).toContainText("phone scams work");
  await closeTopWin(page);
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();

  // Old Bridge: 1pt clue, note BEES
  await dbl(page, "water-tap");
  await dbl(page, "bucket");
  await dbl(page, "clue");
  await page.locator('.zoom-slider input[type="range"]').fill("400");
  await expect(page.locator(".window .word").last()).toContainText("5338");
  await closeTopWin(page);
  await dbl(page, "note");
  await page.fill('.pw-dialog input', "bees");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("Only bees live here");
  await closeTopWin(page);
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();

  // Shyam: properties -> apples question -> liar 2
  await dbl(page, "chautari");
  await dbl(page, "shepherd-b");
  await page.locator('[data-file="shepherd-b-img"]').last().click({ button: "right" });
  await page.click('.ctx-item:has-text("Properties")');
  await page.click('.window:has-text("Properties") >> .wbtn:has-text("Details")');
  await expect(page.locator(".window").last()).toContainText("3 apples");
  await closeTopWin(page);
  await dbl(page, "liar");
  await page.fill('.pw-dialog input', "2");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("Shyam lied");
  await closeTopWin(page);

  // finish -> Trap Master done
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await dbl(page, "box");
  await page.fill('.pw-dialog input', "TIHAR");
  await page.keyboard.press("Enter");
  const offer = page.locator('.prize-card[data-stage="offer"]');
  await expect(offer).toBeVisible({ timeout: 8000 });
  await offer.getByText("Not now").click();
  await page.getByRole("button", { name: "Open my real gift" }).click();
  await expect(page.locator('.challenge[data-challenge="Trap Master"]')).toHaveClass(/done/);
  await expect(page.locator('.challenge[data-challenge="Never Fooled"]')).toHaveClass(/done/);
});

test("level 1 finale offers Play Level 2", async ({ page }) => {
  // finish a level 1 run via a seeded save
  await page.goto("/");
  await page.fill("#team", "Team Peepal");
  await page.click("text=Start the hunt");
  const coach = page.locator(".coach");
  if (await coach.count()) await coach.locator(".skip").click();
  await page.waitForTimeout(500);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("hajurama-box-save-v2")!));
  saved.finished = true;
  saved.finishedMs = 600000;
  saved.prizeResult = "passed";
  await page.evaluate((s) => localStorage.setItem("hajurama-box-save-v2", JSON.stringify(s)), saved);
  await page.reload();
  await expect(page.locator(".finale")).toContainText("With love, Hajurama", { timeout: 8000 });
  await page.getByRole("button", { name: "Play Level 2" }).click();
  await expect(page.locator(".taskbar")).toBeVisible();
  expect(await page.locator(".coach").count()).toBe(0);
  await expect(page.locator('[data-desk="box-root"]')).toContainText("Hajurba's Radio");
});

test("landing preselects level 2 after a level 1 run", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("hajurama-box-runs-v1", JSON.stringify([
      { id: 1, level: 1, team: "A", timeMs: 1, hintsUsed: 0, wrongPasswords: 0, trapsCleared: [], prize: "passed", at: 1 },
    ]));
  });
  await page.goto("/");
  await expect(page.locator('.level-card[data-level="2"]')).toHaveClass(/on/);
});
