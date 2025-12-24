import { test, expect, Page } from '@playwright/test';

// --- TEST DATA ---

const pickupLocation = {
  name: 'VOLKSWAGEN SLOVAKIA, a.s.',
  street: 'Jána Jonáša 1',
  city: 'Bratislava',
  country: 'Slovakia',
  postCode: '841 07',
  contactName: 'Marek Novák',
  contactEmail: 'marek.novak@vw-slovakia.sk',
  contactPhone: '+421 904 345 678',
};

const deliveryLocation = {
  name: 'Volkswagen AG',
  street: 'Berliner Ring 2',
  city: 'Wolfsburg',
  country: 'Germany',
  postCode: '38440',
  contactName: 'Thomas Bauer',
  contactEmail: 'thomas.bauer@volkswagen.de',
  contactPhone: '+49 5361 912345',
};

const cargoDetails = {
  reference: 'PO-VW-2026-001234',
  description: '10 pallets of automotive spare parts and electronic components for VW Wolfsburg production line',
  value: 85000,
  weight: 7500,
  volume: 10,
  maxLength: 10.6,
};

// --- HELPER FUNCTIONS ---

async function selectDate(page: Page, inputIndex: number, day: string) {
  await page.locator('[data-test-id="dp-input"]').nth(inputIndex).click();
  await page.getByRole('button', { name: 'Next month' }).click();
  await page.getByText(day, { exact: true }).click();
  await page.locator('[data-test-id="select-button"]').click();
}

async function fillWaypoint(page: Page, index: number, data: typeof pickupLocation) {
  // Optional fields
  await page.locator(`[id="waypoints[${index}].name"]`).fill(data.name);
  await page.locator(`[id="waypoints[${index}].street"]`).fill(data.street);

  // Required fields
  await page.locator(`[id="waypoints[${index}].city"]`).fill(data.city);
  await page.locator(`[id="waypoints[${index}].country"]`).click();
  await page.locator(`[id="waypoints[${index}].country"]`).fill(data.country);
  await page.getByRole('option', { name: data.country }).click();

  // Optional fields
  await page.locator(`[id="waypoints[${index}].postCode"]`).fill(data.postCode);
  await page.locator(`[id="waypoints[${index}].contactName"]`).fill(data.contactName);
  await page.locator(`[id="waypoints[${index}].contactEmail"]`).fill(data.contactEmail);
  await page.locator(`[id="waypoints[${index}].contactPhone"]`).fill(data.contactPhone);
  await page.getByRole('listitem').filter({ hasText: 'No results found' }).click(); // To close autocomplete dropdown

  // Don't save to directory
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

test('happy path - create transport request', async ({ page }) => {
  // Navigate to create form
  await page.getByRole('link', { name: '+ New request' }).click();
  await expect(page).toHaveURL('/request/create');

  // --- WAYPOINTS TAB ---

  // Pickup (next month, day 15)
  await selectDate(page, 0, '15');
  await fillWaypoint(page, 0, pickupLocation);

  // Delivery (next month, day 20)
  await selectDate(page, 3, '20');
  await fillWaypoint(page, 1, deliveryLocation);

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
