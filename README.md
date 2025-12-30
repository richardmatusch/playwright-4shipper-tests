# 4Shipper Playwright Tests

Playwright test suite for the 4Shipper transport request management system.

## Installation

```bash
npm install
cp .env.example .env  # Then edit .env with test credentials
```

## Running Tests

```bash
npx playwright test                           # Run all tests
npx playwright test --headed                  # Run with browser visible
npx playwright test -g "happy path"           # Run specific test by name
```

## Bug Report: Reference Field Selection Issue

### Summary
When filling out the Cargo Info form, the "Reference" field selector matched multiple elements, causing test failures.

### What Happened
When using `getByRole('textbox', { name: 'Reference' })` in the Cargo Info tab:
- **Initially**: Found 2 Reference textboxes with IDs `waypoints[0].reference` and `waypoints[1].reference`
- **After filling Cargo description**: Found 1 Reference textbox with ID `reference`

### Possible Root Cause
The waypoint Reference fields remain visible in the DOM when first navigating to the Cargo Info tab. Interacting with any cargo field triggers a UI update that hides the waypoint fields and shows the correct cargo Reference field?

### Solutions
Wait for the correct Reference field to appear before filling it:

```typescript
async function fillCargoDetails(page: Page, data: typeof cargoDetails) {
  await page.locator('[id="reference"]').waitFor({ state: 'visible' });
  await page.locator('[id="reference"]').fill(data.reference);
  // ... rest of fields
}
```

Or filling cargo description first works too:

```typescript
  await page.getByRole('textbox', { name: 'Cargo description' }).fill(data.description);
  await page.locator('[id="reference"]').fill(data.reference);
```

## Observed Test Behavior

### Occasional Timeout with Repeated Runs
When running `npx playwright test --repeat-each=XYZ`, the test occasionally timed out on the last iteration at the "Send request" button click (30 second timeout exceeded). Single test runs complete successfully.
