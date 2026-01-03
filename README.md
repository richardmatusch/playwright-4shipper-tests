# 4Shipper Playwright Tests

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
npx playwright test -g "negative" --ui        # Run specific test in UI mode
```

## Debugging Failed Tests

The project is configured to automatically capture screenshots, videos, and trace files on failure.

```bash
npx playwright show-report                                      # View HTML report with screenshots and traces
npx playwright show-trace test-results/[test-name]/trace.zip    # View specific trace file directly
```

## Bugs discovered

### Bug 1: Cargo Reference Field Lazy Rendering
When filling out the Cargo Info form, the "Reference" field selector matched multiple elements, causing test failures.

#### What Happened
When using `getByRole('textbox', { name: 'Reference' })` in the Cargo Info tab:
- **Initially**: Found 2 Reference textboxes with IDs `waypoints[0].reference` and `waypoints[1].reference`
- **After filling Cargo description**: Found 1 Reference textbox with ID `reference`

#### Possible Root Cause?
The waypoint Reference fields remain visible in the DOM when first navigating to the Cargo Info tab. Interacting with any cargo field triggers a UI update that hides the waypoint fields and shows the correct cargo Reference field?

#### Solutions
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

### Bug 2: Date/Time Validation Inconsistency
Datetime fields are required to create a transport request, but unlike City/Country fields, they are not validated on the Waypoints tab. This creates poor UX as users only discover missing dates on the Review tab after completing Cargo and Carriers tabs.

#### Steps to Reproduce
1. Navigate to Create Transport Request
2. Fill only City and Country for both waypoints (skip datetime fields)
3. Click Continue → Successfully proceeds to Cargo Info tab
4. Click Continue → Successfully proceeds to Carriers tab
5. Select a carrier, click Continue → Successfully proceeds to Review tab
6. Click "Send request" → Validation error appears about missing dates

#### Expected Behavior
All required fields (City, Country, AND datetimes) should be validated on the Waypoints tab before allowing Continue, maintaining consistent validation patterns.

### Bug 3: Missing Negative Number Validation
Cargo numeric fields (Value, Max. Length, Overall volume) accept negative values without validation, while only the Overall weight field correctly validates and rejects negative numbers.

#### Steps to Reproduce
1. Navigate to Create Transport Request
2. Complete Waypoints tab (fill required City and Country fields)
3. Click Continue to Cargo Info tab
4. Enter negative value in the following fields: Value, Max. Length, Overall weight, Overall volume

#### Expected Behavior
All numeric cargo fields should reject negative values with validation error: "Ensure this value is greater than or equal to 0"

#### Actual Behavior
- **Overall weight** field: ✅ Shows validation error "Ensure this value is greater than or equal to 0"
- **Value**, **Max. length** and **Overall Volume** fields: ❌ Accept negative values without validation

### Bug 4: Date Picker Cancel Button Doesn't Revert Selection

#### Steps to Reproduce
1. Click on any date/time field (note current value)
2. In the date picker popup, click a different date
3. Click "Cancel" button

#### Expected Behavior
Cancel discards the selection and reverts to previous value (or keeps field empty if it was empty)

#### Actual Behavior
Selected date is kept in the field. Cancel only closes popup without reverting the selection.

**Note:** Cancel only works if no date was clicked. The field value updates immediately on date click, making both "Select" and "Cancel" buttons functionally just popup close buttons.

## Observed Test Behavior

### Occasional Timeout with Repeated Runs
When running `npx playwright test --repeat-each=XYZ`, the test occasionally timed out on the last iteration at the "Send request" button click (30 second timeout exceeded). Single test runs complete successfully.
