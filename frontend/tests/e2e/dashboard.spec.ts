import { test, expect, type Page, type Route } from "@playwright/test";

const API = "http://localhost:8000/api/v1";

async function mockAuth(page: Page, role: "provider_owner" | "professional") {
  // Inject tokens into localStorage before page load
  await page.addInitScript((r: string) => {
    localStorage.setItem("access_token", "fake-token");
    localStorage.setItem("refresh_token", "fake-refresh-token");
    localStorage.setItem("role", r);
    localStorage.setItem("user_id", "1");
  }, role);

  // getMe() uses /users/me, not /auth/me
  await page.route(`${API}/users/me`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: 1, email: "user@test.com", role, is_active: true }),
    })
  );

  // Prevent refresh token redirect loops
  await page.route(`${API}/auth/refresh`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ access_token: "fake-token", refresh_token: "fake-refresh-token" }),
    })
  );
}

test.describe("Owner Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, "provider_owner");
    page.route(`${API}/salons/**`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, name: "My Nail Salon", address: "123 Main St" }),
      })
    );
    page.route(`${API}/providers/**`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, name: "My Nail Salon", address: "123 Main St" }),
      })
    );
    page.route(`${API}/sessions/**`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );
    page.route(`${API}/sessions*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );
    page.route(`${API}/reports/**`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            salon_id: 1,
            salon_name: "My Nail Salon",
            period_start: "2026-02-14",
            period_end: "2026-03-14",
            total_sessions: 0,
            completed_sessions: 0,
            cancelled_sessions: 0,
            total_revenue: 0,
            total_deposits: 0,
          },
          service_popularity: [],
          master_performance: [],
          daily_revenue: [],
        }),
      })
    );
    page.route(`${API}/reports*`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            salon_id: 1,
            salon_name: "My Nail Salon",
            period_start: "2026-02-14",
            period_end: "2026-03-14",
            total_sessions: 0,
            completed_sessions: 0,
            cancelled_sessions: 0,
            total_revenue: 0,
            total_deposits: 0,
          },
          service_popularity: [],
          master_performance: [],
          daily_revenue: [],
        }),
      })
    );
  });

  test("dashboard loads for owner", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("Master Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, "professional");
    page.route(`${API}/masters/me`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, name: "Anna K.", phone: "+1234567890" }),
      })
    );
    page.route(`${API}/professionals/me`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, name: "Anna K.", phone: "+1234567890" }),
      })
    );
    page.route(`${API}/sessions/today`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );
    page.route(`${API}/sessions*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );
    page.route(`${API}/reports/master/me`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            master_id: 1,
            master_name: "Anna K.",
            sessions_completed: 0,
            total_earnings: 0,
            period_start: "2026-02-14",
            period_end: "2026-03-14",
          },
          daily_earnings: [],
        }),
      })
    );
    page.route(`${API}/reports*`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            master_id: 1,
            master_name: "Anna K.",
            sessions_completed: 0,
            total_earnings: 0,
            period_start: "2026-02-14",
            period_end: "2026-03-14",
          },
          daily_earnings: [],
        }),
      })
    );
  });

  test("dashboard loads for master", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("Navigation", () => {
  test("sessions page is accessible", async ({ page }) => {
    await mockAuth(page, "provider_owner");
    await page.route(`${API}/sessions*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );
    await page.route(`${API}/providers*`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, name: "My Nail Salon", address: "123 Main St" }),
      })
    );

    await page.goto("/sessions");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("calendar page is accessible for master", async ({ page }) => {
    await mockAuth(page, "professional");
    // CalendarPage calls useMyProfessionalProfile → GET /professionals/me
    await page.route(`${API}/professionals/me`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1, name: "Anna K.", phone: "+1234567890",
          professional_providers: [{ id: 1, professional_id: 1, provider_id: 1, status: "active" }],
          photos: [],
        }),
      })
    );
    await page.route(`${API}/professionals*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );
    await page.route(`${API}/calendar*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );
    await page.route(`${API}/sessions*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );

    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });
});
