import { expect, test } from "@playwright/test";
for (const [name, path] of [["landing", "/"], ["live", "/live"], ["archive", "/archive"], ["replay", "/replay/demo"], ["lab", "/lab"], ["runs", "/runs"], ["shadow", "/shadow"], ["proof", "/proof"]]) test(`${name} loads without wallet automation`, async ({ page }) => { await page.goto(path); await expect(page.locator("main")).toBeVisible(); });
