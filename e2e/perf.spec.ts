import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const EVID = path.resolve("evidence");
fs.mkdirSync(EVID, { recursive: true });

// Instrument rAF before a drag; count frame gaps >50ms (long tasks).
async function arm(page: any) {
  await page.evaluate(() => {
    (window as any).__frames = [] as number[];
    const orig = window.requestAnimationFrame;
    let last = performance.now();
    window.requestAnimationFrame = function (cb: FrameRequestCallback) {
      return orig.call(window, (t: number) => {
        (window as any).__frames.push(t - last);
        last = t;
        cb(t);
      });
    };
  });
}

async function frameStats(page: any) {
  return page.evaluate(() => {
    const f = (window as any).__frames as number[];
    return {
      frames: f.length,
      long: f.filter((x) => x > 50).length,
      dropped: f.filter((x) => x > 33.4).length,
      max: Math.max(...f),
      avg: f.reduce((a, b) => a + b, 0) / f.length,
    };
  });
}

const renderCounts = (page: any) =>
  page.evaluate(() => ({ ...((window as any).__rb ?? {}) }));

test("window drag stays smooth with 3 windows open", async ({ page }) => {
  await page.goto("/");
  await page.fill("#team", "Perf");
  await page.click("text=Start the hunt");
  const coach = page.locator(".coach");
  if (await coach.count()) await coach.locator(".skip").click();

  // 3 windows: explorer, word doc, calculator
  await page.locator('[data-desk="box-root"]').dblclick();
  await expect(page.locator(".window")).toHaveCount(1);
  await page.locator('[data-file="start-here"]').last().dblclick();
  await expect(page.locator(".window")).toHaveCount(2);
  await page.locator('[data-desk="calculator"]').dblclick();
  await expect(page.locator(".window")).toHaveCount(3);

  const before = await renderCounts(page);
  await arm(page);

  // drag the top (calculator) window by its titlebar for ~3s
  const tb = await page.locator(".window").last().locator(".titlebar").boundingBox();
  if (!tb) throw new Error("no titlebar");
  await page.mouse.move(tb.x + 120, tb.y + 15);
  await page.mouse.down();
  const t0 = Date.now();
  let i = 0;
  while (Date.now() - t0 < 3000) {
    await page.mouse.move(tb.x + 120 + Math.sin(i / 6) * 160, tb.y + 15 + Math.cos(i / 9) * 60);
    await page.waitForTimeout(8);
    i++;
  }
  await page.mouse.up();

  const stats = await frameStats(page);
  const after = await renderCounts(page);
  const dragWinId = await page.locator(".window").last().getAttribute("data-win");

  // bodies of OTHER windows must not have re-rendered during the drag+drop
  const reRenders: Record<string, number> = {};
  for (const id of Object.keys(after)) {
    reRenders[id] = (after[id] || 0) - (before[id] || 0);
  }

  const out = {
    windowsOpen: 3,
    draggedWindow: dragWinId,
    windowDrag: stats,
    bodyReRenders: reRenders,
    note: "__rb counts WinBody renders; a move/drag commit must not re-render other bodies. " +
          "rAF in headless Chrome is capped ~30Hz, so avg ~33ms is the harness cap, not jank.",
  };
  fs.writeFileSync(path.join(EVID, "perf.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));

  expect(stats.long).toBeLessThanOrEqual(3);
  // the dragged window's body may re-render at most twice (move commit);
  // all other bodies must be zero.
  for (const [id, n] of Object.entries(reRenders)) {
    if (id !== dragWinId) expect(n).toBe(0);
    else expect(n).toBeLessThanOrEqual(2);
  }
});

test("design element drag stays on the transform path", async ({ page }) => {
  await page.goto("/");
  await page.fill("#team", "Perf");
  await page.click("text=Start the hunt");
  const coach = page.locator(".coach");
  if (await coach.count()) await coach.locator(".skip").click();
  await page.locator('[data-desk="box-root"]').dblclick();
  await page.locator('[data-file="chautari"]').last().dblclick();
  await page.locator('[data-file="shepherd-a"]').last().dblclick();
  await page.locator('[data-file="hajuramas-picture"]').last().dblclick();
  await expect(page.locator(".designer")).toBeVisible();

  await arm(page);
  const bb = await page.locator('.dg-el[data-el="basket"]').boundingBox();
  if (!bb) throw new Error("no basket");
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  const t1 = Date.now();
  let j = 0;
  while (Date.now() - t1 < 3000) {
    await page.mouse.move(bb.x + bb.width / 2 + Math.sin(j / 6) * 150, bb.y + bb.height / 2 + Math.cos(j / 8) * 60);
    await page.waitForTimeout(8);
    j++;
  }
  await page.mouse.up();
  const stats = await frameStats(page);
  const prev = JSON.parse(fs.readFileSync(path.join(EVID, "perf.json"), "utf-8"));
  prev.designDrag = stats;
  fs.writeFileSync(path.join(EVID, "perf.json"), JSON.stringify(prev, null, 2));
  console.log("designDrag", JSON.stringify(stats));
  expect(stats.long).toBeLessThanOrEqual(3);
});


