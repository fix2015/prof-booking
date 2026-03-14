import { test, expect } from "@playwright/test";

const API = "http://localhost:8000/api/v1";

const SALONS = [{ id: 1, name: "My Nail Salon", address: "123 Main St" }];
const SERVICES = [
  { id: 1, name: "Manicure", duration_minutes: 60, price: 30, is_active: true },
  { id: 2, name: "Pedicure", duration_minutes: 90, price: 45, is_active: true },
];
const MASTERS = [
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
    await page.route(`${API}/salons/public`, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SALONS) })
    );
    await page.route(`${API}/salons/public/1`, (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SALONS[0]),
      })
    );
    await page.route(`${API}/services/salon/1`, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SERVICES) })
    );
    await page.route(`${API}/masters/salon/1/public`, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTERS) })
    );
    await page.route(`${API}/calendar/availability*`, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SLOTS) })
    );
  });

  test("public booking page shows salon selector", async ({ page }) => {
    await page.goto("/salons");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("My Nail Salon")).toBeVisible({ timeout: 5000 });
  });

  test("navigating to /book/1 shows booking form", async ({ page }) => {
    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");
    // Service selection step should be visible
    await expect(page.getByText("Manicure")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Pedicure")).toBeVisible();
  });

  test("selecting a service proceeds to master step", async ({ page }) => {
    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");
    await page.getByText("Manicure").click();
    // Master step
    await expect(page.getByText("Anna K.")).toBeVisible({ timeout: 5000 });
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

    // Step 1: Select service
    await page.getByText("Manicure").click();

    // Step 2: Select master
    await page.getByText("Anna K.").click();

    // Step 3: date/time — click available slot
    await page.getByText(/10:00/i).click();

    // Step 4: Client info
    await page.getByLabel(/name/i).fill("Jane Doe");
    await page.getByLabel(/phone/i).fill("+1234567890");
    await page.getByLabel(/email/i).fill("jane@example.com");

    // Submit
    await page.getByRole("button", { name: /book|confirm/i }).click();

    // Success screen
    await expect(page.getByText(/A1B2C3D4|confirmed|success/i)).toBeVisible({ timeout: 5000 });
  });
});
