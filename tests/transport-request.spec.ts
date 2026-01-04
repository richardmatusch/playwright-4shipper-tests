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
  value: '85000',
  weight: '7500',
  volume: '10',
  maxLength: '10.6',
};

// --- HELPER FUNCTIONS ---

async function navigateToCreateForm(page: Page) {
  await page.getByRole('link', { name: '+ New request' }).click();
  await page.waitForURL('/request/create');
}

/**
 * Select a date from the date picker
 * @param dateInputIndex - Index of the date input field (each waypoint has 2: earliest/latest)
 * @param day - Day of the month to select
 */
async function selectDate(page: Page, dateInputIndex: number, day: string) {
  await page.locator('[data-test-id="dp-input"]').nth(dateInputIndex).click();
  await page.getByRole('button', { name: 'Next month' }).click();
  await page.getByRole('gridcell', { name: day }).click();
  await page.locator('[data-test-id="select-button"]').click();
}

/**
 * Fill only required waypoint fields (city and country)
 * @param waypointIndex - Zero-based index of the waypoint in the form
 */
async function fillWaypointRequired(page: Page, waypointIndex: number, data: { city: string; country: string }) {
  await page.locator(`[id="waypoints[${waypointIndex}].city"]`).fill(data.city);
  await page.locator(`[id="waypoints[${waypointIndex}].country"]`).fill(data.country);
  await page.getByRole('option', { name: data.country }).click();
}

/**
 * Fill waypoint form fields
 * @param waypointIndex - Zero-based index of the waypoint in the form
 */
async function fillWaypoint(page: Page, waypointIndex: number, data: typeof pickupLocation) {
  // Required fields
  await page.locator(`[id="waypoints[${waypointIndex}].city"]`).fill(data.city);
  await page.locator(`[id="waypoints[${waypointIndex}].country"]`).fill(data.country);
  await page.getByRole('option', { name: data.country }).click();

  // Optional fields
  await page.locator(`[id="waypoints[${waypointIndex}].name"]`).fill(data.name);
  await page.locator(`[id="waypoints[${waypointIndex}].street"]`).fill(data.street);
  await page.locator(`[id="waypoints[${waypointIndex}].postCode"]`).fill(data.postCode);
  await page.locator(`[id="waypoints[${waypointIndex}].contactName"]`).fill(data.contactName);
  await page.locator(`[id="waypoints[${waypointIndex}].contactEmail"]`).fill(data.contactEmail);
  await page.locator(`[id="waypoints[${waypointIndex}].contactPhone"]`).fill(data.contactPhone);
  await page.getByRole('listitem').filter({ hasText: 'No results found' }).click(); // To close autocomplete dropdown

  // Don't save to directory
  await page.locator(`input[name="waypoints[${waypointIndex}].saveToDirectory"]`).uncheck();
}

async function fillCargoDetails(page: Page, data: typeof cargoDetails) {  
  await page.locator('[id="reference"]').waitFor({ state: 'visible' }); // WORKAROUND: Reference field lazy rendering issue (see README.md)
  await page.locator('[id="reference"]').fill(data.reference);
  await page.getByRole('textbox', { name: 'Cargo description' }).fill(data.description);
  await page.getByRole('spinbutton', { name: 'Value' }).fill(data.value);
  await page.locator('[id="cargo.maxLength"]').fill(data.maxLength);
  await page.locator('[id="cargo.weight"]').fill(data.weight);
  await page.locator('[id="cargo.volume"]').fill(data.volume);
}

async function deleteRequest(page: Page) {
  await page.locator('#dropdownMenu').first().click();
  await page.locator('.dropdown-menu').getByText('Delete').click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.waitForURL('/request/list');
}

async function discardChanges(page: Page) {
  await page.getByRole('link', { name: 'Requests' }).click();
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await page.waitForURL('/request/list');
}

// --- TESTS ---

test.beforeEach(async ({ page }) => {
  // Login before each test
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(process.env.TEST_USER_EMAIL!);
  await page.getByRole('textbox', { name: 'Password' }).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/request/list');
});

test('happy path - create transport request', async ({ page }) => {
  await navigateToCreateForm(page);

  // --- WAYPOINTS TAB ---
  await expect(page.getByRole('radio', { name: 'One way' })).toBeChecked();
  
  // Pickup
  await expect(page.getByRole('radio', { name: 'Pickup point' }).first()).toBeChecked();
  await selectDate(page, 0, '15'); // Earliest pickup datetime field (next month, day 15)
  await fillWaypoint(page, 0, pickupLocation);

  // Delivery
  await expect(page.getByRole('radio', { name: 'Delivery point' }).nth(1)).toBeChecked();
  await selectDate(page, 3, '20'); // Latest delivery datetime field (index 3 = 2nd waypoint × 2 inputs; next month, day 20)
  await fillWaypoint(page, 1, deliveryLocation);
  await page.getByRole('button', { name: 'Continue' }).click();

  // --- CARGO INFO TAB ---
  await fillCargoDetails(page, cargoDetails);
  await page.getByRole('button', { name: 'Continue' }).click();

  // --- CARRIERS TAB ---
  await page.getByText('Demo carrier').click();
  await page.locator('[id="6847"]').check();
  await page.getByRole('button', { name: 'Continue' }).click();

  // --- REVIEW TAB ---
  await page.getByRole('button', { name: 'Send request' }).click();

  // --- ASSERTIONS ---
  await expect(page).toHaveURL(/\/request\/view\/\d+/);
  await expect(page.getByText(cargoDetails.description)).toBeVisible();

  // --- CLEANUP ---
  await deleteRequest(page);
});

test('negative - form validation scenarios', async ({ page }) => {
  await navigateToCreateForm(page);

  // --- REQUIRED FIELDS VALIDATION (Waypoints tab)---
  await page.getByRole('button', { name: 'Continue' }).click();

  // Both waypoints have City and Country as required fields
  // Expect 4 "This field is required." messages (2 per waypoint)
  // Date and Time are also required, but validated separately - explained in bug report in README.md
  const validationErrors = page.getByText('This field is required.');
  await expect(validationErrors).toHaveCount(4);

  // Fill pickup waypoint, verify errors clear dynamically
  await fillWaypointRequired(page, 0, pickupLocation);
  await expect(validationErrors).toHaveCount(2);

  // Fill delivery waypoint, all errors should be gone
  await fillWaypointRequired(page, 1, deliveryLocation);
  await expect(validationErrors).toHaveCount(0);

  // --- INVALID EMAIL FORMAT ---
  await page.locator('[id="waypoints[0].contactEmail"]').fill('invalid-email');
  await page.getByRole('button', { name: 'Continue' }).click();

  // Verify email validation error appears
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();

  // Fix email format to clear the error
  await page.locator('[id="waypoints[0].contactEmail"]').fill(pickupLocation.contactEmail);
  await expect(page.getByText('Enter a valid email address.')).toHaveCount(0);

  // --- INVALID DATE LOGIC (delivery before pickup) ---
  await selectDate(page, 0, '16');
  await selectDate(page, 3, '15');
  await page.getByRole('button', { name: 'Continue' }).click();

  // Expect validation error
  const dateLogicError = page.getByText('This waypoint time is not in');
  await expect(dateLogicError).toBeVisible();

  // Fix by selecting valid delivery date
  await page.getByRole('button', { name: 'Clear value' }).nth(1).click(); // Clear the invalid date
  await selectDate(page, 3, '17');
  await expect(dateLogicError).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue' }).click();

  // --- OUT-OF-RANGE NUMERIC VALUES (Cargo info tab) ---
  await page.getByRole('spinbutton', { name: 'Value' }).fill('-1');
  await page.locator('[id="cargo.maxLength"]').fill('-1');
  await page.locator('[id="cargo.weight"]').fill('-1');
  await page.locator('[id="cargo.volume"]').fill('-1');
  // Note: Max value validation not tested - upper boundaries unknown and
  // min validation already missing on 3/4 fields (documented in readme)
  await expect(page.getByText('Ensure this value is greater')).toHaveCount(1); // (Should be 4)

  // Fix the value to clear the error
  await page.locator('[id="cargo.weight"]').fill('1');
  await expect(page.getByText('Ensure this value is greater')).toHaveCount(0);

  /*
  await page.getByRole('button', { name: 'Continue' }).click();
  // Carriers tab
  here could go 'no carrier selected' validation if it was implemented in carriers tab
  */

  // --- CLEANUP ---
  await discardChanges(page);
});

test('usability - continue button validation', async ({ page }) => {
  await navigateToCreateForm(page);

  const continueButton = page.getByRole('button', { name: 'Continue' });

  // --- INITIAL STATE: Button starts enabled even when form is empty ---
  await expect(continueButton).toBeEnabled();

  // --- REACTIVE VALIDATION: Click with empty form → button disables + errors appear ---
  await continueButton.click();

  await expect(continueButton).toBeDisabled();
  await expect(page.getByText('This field is required.')).toHaveCount(4);

  // --- BUTTON RE-ENABLES: Fill required fields → button becomes active again ---
  await fillWaypointRequired(page, 0, pickupLocation);
  await fillWaypointRequired(page, 1, deliveryLocation);
  await expect(continueButton).toBeEnabled();

  // --- VERIFY PROGRESSION: Can now proceed to next tab ---
  await continueButton.click();
  // Verify cargo-specific field is visible (Cargo description only appears on Cargo Info tab)
  await expect(page.getByRole('textbox', { name: 'Cargo description' })).toBeVisible();

  // --- CLEANUP ---
  await discardChanges(page);
});