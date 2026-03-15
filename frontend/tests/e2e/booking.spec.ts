import { test, expect } from "@playwright/test";

const API = "http://localhost:8000/api/v1";

const PROVIDERS = [{ id: 1, name: "My Nail Salon", address: "123 Main St" }];
const SERVICES = [
  { id: 1, name: "Manicure", duration_minutes: 60, price: 30, is_active: true },
  { id: 2, name: "Pedicure", duration_minutes: 90, price: 45, is_active: true },
];
const PROFESSIONALS = [
  { id: 1, name: "Anna K.", bio: "5 years experience", avatar_url: null },
];
const SLOTS = [
  {
    master_id: 1,
    master_name: "Anna K.",
    slot_date: "2026-03-15",
    start_time: "10:00:00",
    end_time: "11:00:00",
    work_slot_id: 5,
  },
];

test.describe("Public Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Both /providers/public and /salons/public (compat) paths
    await page.route(`${API}/providers/public`, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROVIDERS) })
    );
    await page.route(`${API}/providers/public/1`, (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(PROVIDERS[0]),
      })
    );
    // Services endpoint now uses /provider/ prefix
    await page.route(`${API}/services/provider/1`, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SERVICES) })
    );
    // Professionals endpoint
    await page.route(`${API}/professionals/provider/1/public`, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROFESSIONALS) })
    );
    await page.route(`${API}/calendar/availability*`, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SLOTS) })
    );
  });

  test("public booking page shows provider selector", async ({ page }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("My Nail Salon")).toBeVisible({ timeout: 5000 });
  });

  test("navigating to /book/1 shows booking form", async ({ page }) => {
    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");
    // Booking form is rendered with service/professional selectors
    // Items are in Radix UI SelectContent (hidden until opened); check form labels instead
    await expect(page.getByText("Service *")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Professional (optional)")).toBeVisible();
  });

  test("selecting a service proceeds to professional step", async ({ page }) => {
    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");
    // BookingForm uses Radix UI Select — items are in a hidden portal until trigger is clicked
    await page.locator('[role="combobox"]').first().click();
    await page.getByRole("option", { name: /manicure/i }).click();
    // Verify professionals are listed in the professional select
    await page.locator('[role="combobox"]').nth(1).click();
    await expect(page.getByRole("option", { name: /anna k/i })).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
  });

  test("full booking form submission", async ({ page }) => {
    await page.route(`${API}/booking/`, (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          session_id: 42,
          client_name: "Jane Doe",
          salon_name: "My Nail Salon",
          service_name: "Manicure",
          starts_at: "2026-03-15T10:00:00",
          ends_at: "2026-03-15T11:00:00",
          price: 30.0,
          confirmation_code: "A1B2C3D4",
        }),
      })
    );

    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");

    // Step 1: Select service via Radix combobox trigger
    await page.locator('[role="combobox"]').first().click();
    await page.getByRole("option", { name: /manicure/i }).click();

    // Step 2: Click available time slot — use getByRole to avoid strict-mode (slot renders "10:00 AM")
    await page.getByRole("button", { name: /10:00/i }).click();

    // Step 3: Client info — use placeholders since inputs lack proper label associations
    await page.getByPlaceholder("Jane Doe").fill("Jane Doe");
    await page.getByPlaceholder("+1 (555) 000-0000").fill("+1234567890");
    await page.getByPlaceholder("jane@example.com").fill("jane@example.com");

    // Submit
    await page.getByRole("button", { name: /book appointment/i }).click();

    // Success screen — check heading specifically to avoid strict-mode (multiple elements match the regex)
    await expect(page.getByRole("heading", { name: /booking confirmed/i })).toBeVisible({ timeout: 5000 });
  });
});
