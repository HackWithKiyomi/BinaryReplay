import { expect, test } from "@playwright/test";
import path from "node:path";

const routes = [
  ["landing", "/", "01-landing.png"], ["live", "/live", "02-live.png"],
  ["archive", "/archive", "03-archive.png"], ["replay", "/replay/demo", "04-replay.png"],
  ["lab", "/lab", "05-strategy-lab.png"], ["runs", "/runs", "06-results.png"],
  ["latency", "/lab", "07-latency.png"],
  ["shadow", "/shadow", "08-shadow.png"], ["proof", "/proof", "09-proof.png"],
  ["docs", "/docs", "10-docs.png"],
] as const;

for (const [name, route, screenshot] of routes) {
  test(`${name} renders anonymously without browser errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
    expect(response?.ok(), `${route} returned a failing response`).toBeTruthy();
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: path.resolve(process.cwd(), "../../docs/screenshots", screenshot), fullPage: true });
    expect(errors, `browser errors on ${route}`).toEqual([]);
  });
}
