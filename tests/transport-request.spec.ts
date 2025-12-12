import { test, expect } from '@playwright/test';

test('login to 4Shipper', async ({ page }) => {
  // I just want to see what is happening... will remove it later...
  test.slow();

  // Go to login page
  await page.goto('/');

  // Fill in credentials
  await page.getByLabel('email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('password').fill(process.env.TEST_USER_PASSWORD!);

  // Click login button
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for login to complete
  await expect(page).toHaveURL('/request/list', { timeout: 10000 });

  // Keep browser open just to see...
  await page.pause();
});
