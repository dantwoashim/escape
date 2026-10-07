import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("word gate: a wrong word shows the error", async ({ page }) => {
  await page.getByRole("button", { name: "Found Hajurama's word?" }).click();
  await page.locator(".word-input").fill("khukuri");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".word-err")).toHaveText("Not that one. Watch again.");
});

test("word gate: bistarai unlocks the free hint and persists", async ({ page }) => {
  await page.getByRole("button", { name: "Found Hajurama's word?" }).click();
  await page.locator(".word-input").fill("Bistarai ");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".word-done")).toHaveText(
    "Bistarai. Slowly, carefully. Your first hint is free.",
  );

  await page.reload();
  await expect(page.locator(".word-done")).toHaveText(
    "Bistarai. Slowly, carefully. Your first hint is free.",
  );

  await page.locator("#team").fill("Peepal");
  await page.getByRole("button", { name: "Start the hunt" }).click();
  await expect(page.locator(".hint-btn").first()).toContainText("· free");
});
