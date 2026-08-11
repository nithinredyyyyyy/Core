import { test, expect } from "@playwright/test";

const WC2026 = "b7224eb0-f9c3-40fd-b568-0cceda3a6fe9";
const BMPS2026 = "fd8472c7-d012-4680-bdc7-39c75d862e98";

test.describe("Deep page check", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`[console.error] ${page.url()} :: ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => {
      console.error(`[pageerror] ${page.url()} :: ${err.message}`);
    });
  });

  async function assertNoFailures(page) {
    const failures = [];
    page.on("response", (res) => {
      if (res.status() >= 400 && !res.url().includes("/api/auth/me")) {
        failures.push(`${res.status()} ${res.url()}`);
      }
    });
    return failures;
  }

  test("home /", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/Core|StageCore/i);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("landing /landing", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto("/landing");
    await expect(page.locator("body")).not.toBeEmpty({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("signin /signin", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto("/signin");
    await expect(page.getByText(/sign in|continue with google|google/i).first()).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("tournaments /tournaments", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto("/tournaments");
    await expect(page.getByRole("heading", { name: "TOURNAMENTS", exact: true })).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("tournament detail (rich data)", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto(`/tournaments?id=${BMPS2026}`);
    await expect(page.getByText(/Battlegrounds Mobile India Pro Series 2026/i).first()).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("tournament detail (empty featured WC2026)", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto(`/tournaments?id=${WC2026}`);
    await expect(page.getByText(/PUBG Mobile World Cup 2026/i).first()).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("teams /teams", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto("/teams");
    await expect(page.getByText(/GodLike Esports/i).first()).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("team detail /teams?team=", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto("/teams?team=GodLike%20Esports");
    await expect(page.getByText(/GodLike Esports/i).first()).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("player profile /players/:ign", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto("/players/ADMINO");
    await expect(page.getByText(/ADMINO/i).first()).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("leaderboard /leaderboard", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { name: /standings/i })).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("rankings /rankings", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto("/rankings");
    await expect(page.getByRole("heading", { name: /team rankings/i })).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("news /news", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto("/news");
    await expect(page.getByText(/news|editorial|loading/i).first()).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("news article /news/:id", async ({ page, request }) => {
    const res = await request.get("/api/news/public?limit=1");
    const articles = await res.json();
    const id = articles[0]?.id;
    expect(id).toBeTruthy();
    const failures = await assertNoFailures(page);
    await page.goto(`/news/${id}`);
    await expect(page.locator("body")).not.toBeEmpty({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("admin gate /admin", async ({ page }) => {
    const failures = await assertNoFailures(page);
    await page.goto("/admin");
    await expect(page.getByText(/admin locked|checking admin access/i)).toBeVisible({ timeout: 20000 });
    await expect(failures).toEqual([]);
  });

  test("404 route", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.locator("body")).not.toBeEmpty({ timeout: 20000 });
  });
});
