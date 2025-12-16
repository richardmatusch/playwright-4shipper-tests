import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Login before each test
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(process.env.TEST_USER_EMAIL!);
  await page.getByRole('textbox', { name: 'Password' }).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL('/request/list');
});

test('minimal happy path - create transport request using only mandatory fields', async ({ page }) => {
  // Navigate to create form
  await page.getByRole('link', { name: '+ New request' }).click();
  await expect(page).toHaveURL('/request/create');

  // --- WAYPOINTS TAB ---

  // Pickup date (next month, day 15)
  await page.locator('[data-test-id="dp-input"]').first().click();
  await page.getByRole('button', { name: 'Next month' }).click();
  await page.getByText('15', { exact: true }).click();
  await page.locator('[data-test-id="select-button"]').click();

  // Pickup city 
  await page.locator('[id="waypoints[0].city"]').fill('Bratislava');
  await page.locator('[id="waypoints[0].country"]').click();
  await page.locator('[id="waypoints[0].country"]').fill('Slovakia');
  await page.getByRole('option', { name: 'Slovakia' }).click();
  await page.locator('input[name="waypoints[0].saveToDirectory"]').uncheck(); // Do not save address to directory

  // Delivery date (next month, day 20)
  await page.locator('[data-test-id="dp-input"]').nth(3).click();
  await page.getByRole('button', { name: 'Next month' }).click();
  await page.getByText('20', { exact: true }).click();
  await page.locator('[data-test-id="select-button"]').click();

  // Delivery city 
  await page.locator('[id="waypoints[1].city"]').fill('Prague');
  await page.locator('[id="waypoints[1].country"]').click();
  await page.locator('[id="waypoints[1].country"]').fill('Czechia');
  await page.getByRole('option', { name: 'Czechia' }).click();
  await page.locator('input[name="waypoints[1].saveToDirectory"]').uncheck(); // Do not save address to directory

  // --- CARGO INFO TAB (skip - no mandatory fields) ---
  await page.getByRole('button', { name: 'Continue' }).click();

  // --- CARRIERS TAB ---
  await page.getByRole('button', { name: 'Continue' }).click();

  // Select Demo carrier
  await page.getByText('Demo carrier').click();

  // Continue to Review
  await page.getByRole('button', { name: 'Continue' }).click();

  // --- REVIEW TAB ---
  await page.getByRole('button', { name: 'Send request' }).click();

  // --- ASSERTIONS ---
  await expect(page.getByText('Bidding active')).toBeVisible();
  await expect(page).toHaveURL(/\/request\//);

  // --- CLEANUP ---
  // Open dropdown menu
  await page.locator('#dropdownMenu').first().click();
  // Click Delete option
  await page.locator('.dropdown-menu').getByText('Delete').click();
  // Confirm deletion
  await page.getByRole('button', { name: 'Delete' }).click();

  // Verify redirected back to list
  await expect(page).toHaveURL('/request/list');
});

test('realistic happy path - create transport request as typical user would', async ({ page }) => {
  // TODO: implement
});

test('negative - required fields validation', async ({ page }) => {
  // TODO: implement
});

test('usability - button states or duplicate submit', async ({ page }) => {
  // TODO: implement
});
