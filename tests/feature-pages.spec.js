import { test, expect } from "@playwright/test";

test.describe("Feature coverage", () => {
  test("mobile bottom nav navigates to rankings", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const nav = page.getByRole("link", { name: /rankings/i });
    await expect(nav).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: "Standings" })).toHaveCount(0);
    await nav.click();
    await expect(
      page.getByRole("heading", { name: /team rankings/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("desktop dark-mode toggle applies dark theme", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Switch to dark mode" });
    await expect(toggle).toBeVisible({ timeout: 15000 });
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(
      page.getByRole("button", { name: "Switch to light mode" })
    ).toBeVisible();
  });
});
