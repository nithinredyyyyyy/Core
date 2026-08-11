import { test, expect } from "@playwright/test";

test.describe("Core public pages", () => {
  test("homepage loads featured tournament hub", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Core|StageCore/i);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("tournaments page lists events", async ({ page }) => {
    await page.goto("/tournaments");
    await expect(page.getByRole("heading", { name: "TOURNAMENTS", exact: true })).toBeVisible({
      timeout: 15000,
    });
  });

  test("teams page loads directory", async ({ page }) => {
    await page.goto("/teams");
    await expect(page.getByText(/teams|loading teams/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("rankings page loads live board", async ({ page }) => {
    await page.goto("/rankings");
    await expect(page.getByRole("heading", { name: /team rankings/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/GodLike|Team SOUL|Orangutan/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("leaderboard page loads standings", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { name: /standings/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test("news page loads feed", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByText(/news|editorial|loading/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("admin route is locked without auth", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/admin locked|checking admin access/i)).toBeVisible({
      timeout: 15000,
    });
  });
});
