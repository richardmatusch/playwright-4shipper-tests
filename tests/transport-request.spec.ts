import { test, expect, Page } from '@playwright/test';

// --- HELPER FUNCTIONS ---

async function selectDate(page: Page, inputIndex: number, day: string) {
  await page.locator('[data-test-id="dp-input"]').nth(inputIndex).click();
  await page.getByRole('button', { name: 'Next month' }).click();
  await page.getByText(day, { exact: true }).click();
  await page.locator('[data-test-id="select-button"]').click();
}

async function fillWaypoint(page: Page, index: number, city: string, country: string) {
  await page.locator(`[id="waypoints[${index}].city"]`).fill(city);
  await page.locator(`[id="waypoints[${index}].country"]`).click();
  await page.locator(`[id="waypoints[${index}].country"]`).fill(country);
  await page.getByRole('option', { name: country }).click();
  await page.locator(`input[name="waypoints[${index}].saveToDirectory"]`).uncheck();
}

async function deleteRequest(page: Page) {
  await page.locator('#dropdownMenu').first().click();
  await page.locator('.dropdown-menu').getByText('Delete').click();
  await page.getByRole('button', { name: 'Delete' }).click();
}

// --- TESTS ---

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

  // Pickup (next month, day 15)
  await selectDate(page, 0, '15');
  await fillWaypoint(page, 0, 'Bratislava', 'Slovakia');

  // Delivery (next month, day 20)
  await selectDate(page, 3, '20');
  await fillWaypoint(page, 1, 'Prague', 'Czechia');

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
  await deleteRequest(page);
  await expect(page).toHaveURL('/request/list');
});

test('negative - required fields validation', async ({ page }) => {
  // TODO: implement
});

test('usability - button states or duplicate submit', async ({ page }) => {
  // TODO: implement
});
