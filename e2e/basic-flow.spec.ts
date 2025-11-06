import { test, expect } from '@playwright/test';

test.describe('Basic User Flow', () => {
  test('should navigate from landing page to auth page', async ({ page }) => {
    await page.goto('/en');

    await expect(page.locator('h1')).toContainText('PostMuse.ai');
    await expect(page.locator('h2')).toContainText('AI-Powered Social Content Assistant');

    await page.click('text=Sign Up');

    await expect(page).toHaveURL(/.*\/auth/);
  });

  test('should display language toggle on landing page', async ({ page }) => {
    await page.goto('/en');

    const languageToggle = page.locator('button:has-text("EN")');
    await expect(languageToggle).toBeVisible();

    await languageToggle.click();

    await expect(page).toHaveURL(/.*\/swa/);
  });

  test('should display pricing page with payment details', async ({ page }) => {
    await page.goto('/en/pricing');

    await expect(page.locator('h2')).toContainText('Choose Your Plan');
    await expect(page.getByText('Selcom Microfinance Bank')).toBeVisible();
    await expect(page.getByText('NAIMAN PASCAL KUNAMBI')).toBeVisible();
  });

  test('should show auth form with email and password fields', async ({ page }) => {
    await page.goto('/en/auth');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
