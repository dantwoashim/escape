import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const EVID = path.resolve("evidence");
fs.mkdirSync(EVID, { recursive: true });
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(EVID, `${name}.png`), animations: "disabled" });

async function startGame(page: Page) {
  await page.goto("/");
  await page.fill("#team", "Team Peepal");
  await page.click("text=Start the hunt");
  // skip coach marks
  const skip = page.locator(".coach .skip");
  if (await skip.count()) await skip.click();
}

// double-click a file/folder in the topmost explorer window
async function dbl(page: Page, id: string) {
  const el = page.locator(`[data-file="${id}"]`).last();
  await el.scrollIntoViewIfNeeded();
  await el.dblclick();
}

async function closeTopWin(page: Page) {
  // close the window with highest z via its visible close button (last in DOM is usually on top)
  const wins = page.locator(".window");
  const n = await wins.count();
  if (n === 0) return;
  // find max z-index
  let top = 0, idx = 0;
  for (let i = 0; i < n; i++) {
    const z = parseInt((await wins.nth(i).evaluate((e) => getComputedStyle(e).zIndex)) || "0");
    if (z >= top) { top = z; idx = i; }
  }
  await wins.nth(idx).locator(".tb-btn.close").click();
}

async function openBox(page: Page) {
  await page.locator('[data-desk="box-root"]').dblclick();
  await expect(page.locator(".window .explorer")).toBeVisible();
}

test("full correct-path playthrough to finale", async ({ page }) => {
  await page.goto("/");
  await page.fill("#team", "Team Peepal");
  await page.click("text=Start the hunt");
  // coach mark step 1 visible before skipping
  await expect(page.locator(".coach")).toBeVisible();
  await shot(page, "coach-marks-1366");
  await page.locator(".coach .skip").click();
  await shot(page, "desktop-1366");

  await openBox(page);
  // START HERE
  await dbl(page, "start-here");
  await expect(page.locator(".window .word")).toBeVisible();
  await page.locator(".window .word .page").first().click();
  await page.keyboard.press("Control+a");
  await page.waitForTimeout(300);
  await shot(page, "word-start-here-selectall-1366");
  // white text revealed: "JR ZKHUH..." should be selectable text
  await expect(page.locator(".page")).toContainText("JR ZKHUH SHRSOH UHVW");
  await closeTopWin(page);

  // Chautari, details sort, leaf 17
  await dbl(page, "chautari");
  // breadcrumb shows the full nested path
  await expect(page.locator(".breadcrumb")).toContainText("Desktop");
  await expect(page.locator(".breadcrumb")).toContainText("Hajurama's Box");
  await expect(page.locator(".breadcrumb")).toContainText("Chautari");
  await page.locator('.view-switch button[title="Details"]').click();
  await page.locator('th[data-col="modified"]').click();
  await shot(page, "explorer-details-1366");
  const firstRow = page.locator("table.details tbody tr").first();
  await expect(firstRow).toContainText("leaf 17");
  await dbl(page, "leaf-17");
  await expect(page.locator(".window .word").last()).toContainText("MOMO + MOMO + MOMO = 30");
  await closeTopWin(page);

  // FORK password 42
  await dbl(page, "fork");
  await expect(page.locator(".pw-dialog")).toBeVisible();
  await shot(page, "password-dialog-1366");
  await page.fill('.pw-dialog input', "43");
  await page.keyboard.press("Enter");
  await expect(page.locator(".pw-err")).toContainText("incorrect");
  await page.fill('.pw-dialog input', "42");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("Shepherd B is lying");
  await closeTopWin(page);

  // Shepherd A, Hajurama's Picture, drag basket away
  await dbl(page, "shepherd-a");
  // deeper still: breadcrumb includes Shepherd A
  await expect(page.locator(".breadcrumb")).toContainText("Shepherd A");
  await shot(page, "explorer-shepherd-a-1366");
  // clicking the box-root crumb goes back to the root listing
  await page.locator(".breadcrumb .crumb", { hasText: "Hajurama's Box" }).click();
  await expect(page.locator(".breadcrumb")).toContainText("Desktop");
  await expect(page.locator(".breadcrumb")).not.toContainText("Chautari");
  await expect(page.locator('[data-file="start-here"]').last()).toBeVisible();
  // navigate back down for the design step
  await dbl(page, "chautari");
  await dbl(page, "shepherd-a");
  await dbl(page, "hajuramas-picture");
  await expect(page.locator(".designer")).toBeVisible();
  await shot(page, "designer-before-1366");
  const basket = page.locator('.dg-el[data-el="basket"]');
  const bb = await basket.boundingBox();
  const board = await page.locator(".artboard").boundingBox();
  if (!bb || !board) throw new Error("no basket/board");
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(bb.x + bb.width / 2 + i * 40, bb.y + bb.height / 2 + i * 8);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(200);
  await shot(page, "designer-after-1366");
  await closeTopWin(page);

  // Recycle Bin via start menu, restore last page
  await page.click(".start-btn");
  await page.click(".sm-item:has-text('Recycle Bin')");
  await expect(page.getByRole("dialog", { name: "Recycle Bin" })).toBeVisible();
  await shot(page, "recycle-bin-1366");
  const row = page.locator('[data-file="last-page"]').last();
  await row.click({ button: "right" });
  await page.click(".ctx-item:has-text('Restore')");
  await expect(page.locator(".window").last()).toContainText("Recycle Bin is empty");
  await closeTopWin(page);

  // navigate explorer back to Shepherd A, last page
  await dbl(page, "last-page");
  await expect(page.locator(".window .word").last()).toContainText("Tenzing Norgay");
  await expect(page.locator(".window .word").last()).toContainText("Ctrl + T");
  await closeTopWin(page);

  // FINAL CODE password 1953
  await dbl(page, "final-code");
  await page.fill('.pw-dialog input', "1953");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("IFXMFNS");
  await closeTopWin(page);

  // BOX: navigate up to box root
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await dbl(page, "box");
  await page.fill('.pw-dialog input', "dashain");
  await page.keyboard.press("Enter");
  await expect(page.locator(".finale")).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1600);
  // the open lid must be fully inside the 1366x768 viewport
  const lid = await page.evaluate(() => {
    const lidEl = document.querySelector(".finale svg g[style*='transform-origin']") as SVGGElement | null;
    const r = (lidEl ?? document.querySelector(".finale svg")!).getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
  });
  expect(lid.top).toBeGreaterThanOrEqual(0);
  expect(lid.bottom).toBeLessThanOrEqual(768);
  expect(lid.left).toBeGreaterThanOrEqual(0);
  expect(lid.right).toBeLessThanOrEqual(1366);
  await expect(page.locator(".finale")).toContainText("You found Hajurama");

  // ---- final prize prank: fake eSewa login ----
  const offer = page.locator('.prize-card[data-stage="offer"]');
  await expect(offer).toBeVisible({ timeout: 5000 });
  await expect(offer).toContainText("Rs 1,00,000");
  await expect(page.locator(".finale")).not.toContainText("With love");
  await shot(page, "prize-offer-1366");
  // empty submit shows the inline error, still stage 1
  await offer.getByRole("button", { name: /Receive Rs/ }).click();
  await expect(offer).toContainText("Enter your eSewa ID and password");
  // reload: prizeResult still null, so the offer shows again
  await page.reload();
  const offer2 = page.locator('.prize-card[data-stage="offer"]');
  await expect(offer2).toBeVisible({ timeout: 8000 });
  // masked field is a text input rendered as discs (never type=password)
  const pwInput = offer2.getByLabel("eSewa password");
  await expect(pwInput).toHaveAttribute("type", "text");
  expect(await pwInput.evaluate((el) => getComputedStyle(el).getPropertyValue("-webkit-text-security"))).toBe("disc");
  // fall for it
  await offer2.getByLabel("eSewa ID").fill("9800000000");
  await pwInput.fill("hunter2secret");
  await offer2.getByRole("button", { name: /Receive Rs/ }).click();
  await expect(page.locator('.prize-card[data-stage="fell"]')).toContainText("disappointed");
  await shot(page, "prize-fell-1366");
  // nothing typed was ever persisted
  const stored = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  expect(stored).not.toContain("9800000000");
  expect(stored).not.toContain("hunter2secret");
  await page.getByRole("button", { name: "Sorry, Hajurama" }).click();
  await expect(page.locator(".finale")).toContainText("With love, Hajurama");
  await expect(page.locator(".finale")).toContainText("Fell for it");
  // score = shown time + 0 hints + 1 wrong password (the "43" at FORK)
  const shownTime = await page.locator(".stat", { hasText: "Time" }).locator(".v").textContent();
  const [mm, ss] = shownTime!.split(":").map(Number);
  const expectedScore = `${String(Math.floor((mm * 60 + ss + 30) / 60)).padStart(2, "0")}:${String((mm * 60 + ss + 30) % 60).padStart(2, "0")}`;
  await expect(page.locator(".score-v")).toHaveText(expectedScore);
  // Perfect Run is not done (1 wrong password), Never Fooled not done
  await expect(page.locator('.challenge[data-challenge="Perfect Run"]')).not.toHaveClass(/done/);
  await expect(page.locator('.challenge[data-challenge="Never Fooled"]')).not.toHaveClass(/done/);
  await expect(page.locator('.challenge[data-challenge="Trap Master"]')).toContainText("0/4");
  // the current run is recorded and highlighted in past runs
  await expect(page.locator(".runs-table tr.current")).toContainText("Team Peepal");
  await shot(page, "finale-1366");
  // frozen time: timer equals finale time and doesn't advance
  const finaleTime = await page.locator(".finale .stat .v").first().textContent();
  await page.waitForTimeout(1500);
  expect(await page.locator(".finale .stat .v").first().textContent()).toBe(finaleTime);
});

test("replay: Try a challenge, trap chip, New team keeps runs", async ({ page }) => {
  await startGame(page);
  await page.waitForTimeout(500);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("hajurama-box-save-v2")!));
  saved.finished = true;
  saved.finishedMs = 600000;
  saved.prizeResult = null;
  await page.evaluate((s) => localStorage.setItem("hajurama-box-save-v2", JSON.stringify(s)), saved);
  await page.reload();
  const offer = page.locator('.prize-card[data-stage="offer"]');
  await expect(offer).toBeVisible({ timeout: 8000 });
  await offer.getByText("Not now").click();
  await page.getByRole("button", { name: "Open my real gift" }).click();
  await expect(page.locator(".finale")).toContainText("With love, Hajurama");

  // Try a challenge: straight to desktop, same team, no coach marks
  await page.getByRole("button", { name: /Try a challenge/ }).click();
  await expect(page.locator(".taskbar")).toBeVisible();
  expect(await page.locator(".coach").count()).toBe(0);
  await expect(page.locator(".trap-chip")).toContainText("Traps 0/4");
  await shot(page, "replay-taskbar-1366");

  // clear the tea shop trap end: PIN input reveals the scam lesson
  await page.locator('[data-desk="box-root"]').dblclick();
  await dbl(page, "tea-shop");
  await dbl(page, "prize");
  await page.fill('.field-row input[aria-label="PIN"]', "1234");
  await page.waitForTimeout(1400);
  await expect(page.locator(".window .word").last()).toContainText("phone scams work");
  await expect(page.locator(".trap-chip")).toContainText("Traps 1/4");
  await page.reload();
  const coach2 = page.locator(".coach");
  if (await coach2.count()) await coach2.locator(".skip").click();
  await expect(page.locator(".trap-chip")).toContainText("Traps 1/4");
});

test("New team goes to landing empty, past runs stay", async ({ page }) => {
  await startGame(page);
  await page.waitForTimeout(500);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("hajurama-box-save-v2")!));
  saved.finished = true;
  saved.finishedMs = 600000;
  saved.prizeResult = "passed";
  saved.team = "Old Team";
  await page.evaluate((s) => {
    localStorage.setItem("hajurama-box-save-v2", JSON.stringify(s));
    localStorage.setItem("hajurama-box-runs-v1", JSON.stringify([
      { id: 1, team: "Old Team", timeMs: 600000, hintsUsed: 0, wrongPasswords: 0, trapsCleared: [], prize: "passed", at: Date.now() },
    ]));
  }, saved);
  await page.reload();
  await expect(page.locator(".runs-table")).toContainText("Old Team");
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "New team" }).click();
  await expect(page.locator(".landing")).toBeVisible();
  await expect(page.locator("#team")).toHaveValue("");
  await shot(page, "landing-1366");
  const runs = await page.evaluate(() => localStorage.getItem("hajurama-box-runs-v1"));
  expect(runs).toContain("Old Team");
});

test("prize scam: Not now passes the real test", async ({ page }) => {
  await startGame(page);
  await page.waitForTimeout(500); // let the save land
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("hajurama-box-save-v2")!));
  saved.finished = true;
  saved.finishedMs = 1234567;
  saved.prizeResult = null;
  await page.evaluate((s) => localStorage.setItem("hajurama-box-save-v2", JSON.stringify(s)), saved);
  await page.reload();
  const offer = page.locator('.prize-card[data-stage="offer"]');
  await expect(offer).toBeVisible({ timeout: 8000 });
  await offer.getByText("Not now").click();
  await expect(page.locator('.prize-card[data-stage="passed"]')).toContainText("Shabash");
  await shot(page, "prize-passed-1366");
  await page.getByRole("button", { name: "Open my real gift" }).click();
  await expect(page.locator(".finale")).toContainText("With love, Hajurama");
  await expect(page.locator(".finale")).toContainText("Passed");
  await expect(page.locator(".finale")).toContainText("Refused a fake eSewa login");
  await shot(page, "finale-5stats-1366");
});

test("trap paths: temple, tea shop, water tap, shepherd B", async ({ page }) => {
  await startGame(page);
  await openBox(page);

  // Temple, Inside, Bell, prayer, Ctrl+H replace @
  await dbl(page, "temple");
  await dbl(page, "temple-inside");
  await dbl(page, "bell");
  await dbl(page, "prayer");
  const prayerWin = page.locator(".window .word").last();
  await prayerWin.locator(".page").click();
  await page.keyboard.press("Control+h");
  await page.fill('.fr-dialog input[aria-label="Find what"]', "@");
  await shot(page, "word-replace-dialog-1366");
  await page.click('.fr-dialog button:has-text("Replace All")');
  await expect(page.locator(".toast")).toContainText("replacements");
  await shot(page, "word-replace-toast-1366");
  await expect(prayerWin).toContainText("national flower of Nepal");
  await closeTopWin(page);

  // blessing password RHODODENDRON shows the trap message
  await dbl(page, "blessing");
  await page.fill('.pw-dialog input', "rhododendron");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("WKLV ERA LV HPSWB");
  await closeTopWin(page);
  // navigate back up to box root
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();

  // Tea Shop, PRIZE, typing a PIN reveals the scam page
  await dbl(page, "tea-shop");
  await dbl(page, "prize");
  await page.fill('.field-row input[aria-label="PIN"]', "1234");
  await page.waitForTimeout(1400);
  await expect(page.locator(".window .word").last()).toContainText("phone scams work");
  await shot(page, "teashop-scam-1366");
  await closeTopWin(page);
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();

  // Water Tap, Bucket, clue (1pt), zoom, note HELLO
  await dbl(page, "water-tap");
  await dbl(page, "bucket");
  await dbl(page, "clue");
  await page.locator('.zoom-slider input[type="range"]').fill("400");
  await expect(page.locator(".window .word").last()).toContainText("0.7734");
  await closeTopWin(page);

  // calculator 0.7734
  await page.click(".start-btn");
  await page.click(".sm-item:has-text('Calculator')");
  for (const ch of ["0", ".", "7", "7", "3", "4"]) {
    await page.locator(".calc-key", { hasText: new RegExp(`^${ch === "." ? "\\." : ch}$`) }).click();
  }
  await shot(page, "calculator-07734-1366");
  await closeTopWin(page);

  // note HELLO
  await dbl(page, "note");
  await page.fill('.pw-dialog input', "hello");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("Only water here");
  await closeTopWin(page);
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();

  // Shepherd B: right-click image, Properties, Details
  await dbl(page, "chautari");
  await dbl(page, "shepherd-b");
  const img = page.locator('[data-file="shepherd-b-img"]').last();
  await img.click({ button: "right" });
  await page.click('.ctx-item:has-text("Properties")');
  await page.click('.window:has-text("Properties") >> .wbtn:has-text("Details")');
  await expect(page.locator(".window").last()).toContainText("months have 28 days");
  await shot(page, "properties-shepherd-b-1366");
  await closeTopWin(page);
  // liar password 12
  await dbl(page, "liar");
  await page.fill('.pw-dialog input', "12");
  await page.keyboard.press("Enter");
  await expect(page.locator(".window .word").last()).toContainText("ALWAYS lie");
  await closeTopWin(page);

  // all 4 traps cleared, finish the game and check the challenges
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await page.locator('.exp-toolbar .nav-btn[aria-label="Up"]').first().click();
  await dbl(page, "box");
  await page.fill('.pw-dialog input', "dashain");
  await page.keyboard.press("Enter");
  const offer = page.locator('.prize-card[data-stage="offer"]');
  await expect(offer).toBeVisible({ timeout: 8000 });
  await offer.getByText("Not now").click();
  await page.getByRole("button", { name: "Open my real gift" }).click();
  await expect(page.locator(".finale")).toContainText("With love, Hajurama");
  await expect(page.locator('.challenge[data-challenge="Trap Master"]')).toHaveClass(/done/);
  await expect(page.locator('.challenge[data-challenge="Never Fooled"]')).toHaveClass(/done/);
  await shot(page, "finale-challenges-1366");
});

test("hint button costs tokens and shows text; reload resumes progress", async ({ page }) => {
  await startGame(page);
  await openBox(page);
  await dbl(page, "start-here");
  await page.locator(".window .word .page").first().click();
  await page.keyboard.press("Control+a");
  // ask hint, level 1 for next milestone (enteredChautari)
  await page.click(".hint-btn");
  await expect(page.locator(".hint-card")).toContainText("big tree");
  await shot(page, "hint-level1-1366");
  await page.click(".hint-card .close");
  // reload resumes straight into the game: tokens=2, milestones kept
  await page.reload();
  const coach = page.locator(".coach");
  if (await coach.count()) await coach.locator(".skip").click();
  await expect(page.locator(".taskbar")).toBeVisible();
  await expect(page.locator(".hint-btn")).toContainText("2");
  // hint again gives level 2
  await page.click(".hint-btn");
  await expect(page.locator(".hint-card")).toContainText("Chautari");
});

test("stale save lands with a resume option, timer does not count closed hours", async ({ page }) => {
  await startGame(page);
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    // freeze heartbeat writes so pagehide doesn't stamp a fresh one on the way out
    const real = localStorage.setItem.bind(localStorage);
    (localStorage as unknown as { setItem: (k: string, v: string) => void }).setItem =
      (k, v) => { if (k !== "hajurama-box-seen-v1") real(k, v); };
    const s = JSON.parse(localStorage.getItem("hajurama-box-save-v2")!);
    s.startTs = Date.now() - 4 * 3600_000;
    real("hajurama-box-save-v2", JSON.stringify(s));
    real("hajurama-box-seen-v1", String(s.startTs + 5000));
  });
  await page.reload();
  await expect(page.locator(".landing")).toBeVisible();
  await expect(page.getByRole("button", { name: /Resume Level 1/ })).toBeVisible();
  await page.getByRole("button", { name: /Resume Level 1/ }).click();
  await expect(page.locator(".taskbar")).toBeVisible();
  const t = await page.locator(".timer").textContent();
  expect(t!.startsWith("00:0")).toBe(true); // under a minute, not 4 hours
});

test("a quick reload still auto-resumes mid-game", async ({ page }) => {
  await startGame(page);
  await openBox(page);
  await page.waitForTimeout(2500); // let the heartbeat land
  await page.reload();
  const coach = page.locator(".coach");
  if (await coach.count()) await coach.locator(".skip").click();
  await expect(page.locator(".taskbar")).toBeVisible();
  const t = await page.locator(".timer").textContent();
  expect(parseInt(t!.split(":")[0])).toBeLessThan(2);
});

test("teacher panel via hash", async ({ page }) => {
  await page.goto("/#teacher");
  await page.fill("#team", "T");
  await page.click("text=Start the hunt");
  const coach = page.locator(".coach");
  if (await coach.count()) await coach.locator(".skip").click();
  await expect(page.locator(".teacher")).toContainText("FORK→42");
  await shot(page, "teacher-panel-1366");

  // past runs table + clear
  await page.evaluate(() => {
    localStorage.setItem("hajurama-box-runs-v1", JSON.stringify([
      { id: 1, team: "Run A", timeMs: 600000, hintsUsed: 1, wrongPasswords: 0, trapsCleared: ["tea-shop"], prize: "passed", at: 1 },
    ]));
  });
  await page.reload();
  await page.goto("/#teacher");
  await page.waitForTimeout(500);
  const coachB = page.locator(".coach");
  if (await coachB.count()) await coachB.locator(".skip").click();
  await page.keyboard.press("Control+Alt+h");
  await expect(page.locator(".teacher")).toBeVisible();
  await expect(page.locator(".teacher .teacher-runs")).toContainText("Run A");
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Clear past runs" }).click();
  await expect(page.locator(".teacher")).toContainText("None yet.");
  expect(await page.evaluate(() => localStorage.getItem("hajurama-box-runs-v1"))).toBeNull();
});
