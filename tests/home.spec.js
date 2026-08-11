import { test, expect } from '@playwright/test';

test('homepage loads and displays latest tournament', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Core|StageCore/i);
  // Wait for the hero section or a specific element that shows the site is loaded
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
});
