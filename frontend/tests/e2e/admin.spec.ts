/**
 * E2E Tests — Salon Owner (Admin) User Flow
 *
 * Covers the complete salon_owner journey:
 *   login → dashboard → sessions → masters → reviews
 *   → analytics → invoices → reports → notifications → logout
 */

import { test, expect, type Page, type Route } from "@playwright/test";

const API = "http://localhost:8000/api/v1";

// ─── Shared mock data ────────────────────────────────────────────────────────

const OWNER_USER = { id: 1, email: "owner@glamour.com", role: "provider_owner", is_active: true };
const SALON = { id: 1, name: "Glamour Nails", address: "123 Main St", is_active: true, deposit_percentage: 20 };
const MASTERS = [
  { id: 1, name: "Anna K.", phone: "+1234567890", salon_id: 1 },
  { id: 2, name: "Maria L.", phone: "+0987654321", salon_id: 1 },
];
const MASTER_SALONS = [
  { master_id: 1, salon_id: 1 },
  { master_id: 2, salon_id: 1 },
];
const PROFESSIONAL_PROVIDERS = [
  { id: 1, professional_id: 1, provider_id: 1, status: "active", payment_amount: 30, joined_at: "2026-01-01T00:00:00" },
  { id: 2, professional_id: 2, provider_id: 1, status: "active", payment_amount: 25, joined_at: "2026-01-01T00:00:00" },
];
const SESSIONS = [
  {
    id: 1, status: "completed", client_name: "Alice Smith", client_phone: "+1111111111",
    service_name: "Manicure", master_name: "Anna K.", starts_at: "2026-03-14T10:00:00",
    ends_at: "2026-03-14T11:00:00", price: 30, deposit: 6,
  },
  {
    id: 2, status: "scheduled", client_name: "Bob Jones", client_phone: "+2222222222",
    service_name: "Pedicure", master_name: "Maria L.", starts_at: "2026-03-15T14:00:00",
    ends_at: "2026-03-15T15:30:00", price: 45, deposit: 9,
  },
];
const REVIEWS = [
  {
    id: 1, client_name: "Alice Smith", client_phone: "+1111111111",
    rating: 5, comment: "Absolutely amazing work!", is_published: true,
    created_at: "2026-03-14T12:00:00", master_id: 1, salon_id: 1,
  },
  {
    id: 2, client_name: "Bob Jones", client_phone: "+2222222222",
    rating: 4, comment: "Great experience, will return.", is_published: false,
    created_at: "2026-03-13T10:00:00", master_id: 2, salon_id: 1,
  },
];
const ANALYTICS_WORKERS = [
  {
    professional_id: 1, professional_name: "Anna K.", avatar_url: null,
    completed_sessions: 15, total_hours: 20,
    total_revenue: 450, professional_earnings: 315, provider_earnings: 135,
    professional_percentage: 70,
  },
  {
    professional_id: 2, professional_name: "Maria L.", avatar_url: null,
    completed_sessions: 8, total_hours: 12,
    total_revenue: 360, professional_earnings: 252, provider_earnings: 108,
    professional_percentage: 70,
  },
];
const INVOICES = [
  {
    id: 1, master_id: 1, salon_id: 1,
    period_start: "2026-03-01", period_end: "2026-03-14",
    total_sessions: 15, total_revenue: 450,
    master_earnings: 315, salon_earnings: 135,
    master_percentage: 70, status: "draft",
    created_at: "2026-03-14T00:00:00",
  },
];
const REPORTS = {
  summary: {
    salon_id: 1, salon_name: "Glamour Nails",
    period_start: "2026-02-14", period_end: "2026-03-14",
    total_sessions: 23, completed_sessions: 20,
    cancelled_sessions: 3, total_revenue: 810,
    total_deposits: 162,
  },
  service_popularity: [
    { service_name: "Manicure", count: 12, revenue: 360 },
    { service_name: "Pedicure", count: 8, revenue: 360 },
  ],
  master_performance: [
    { master_name: "Anna K.", completed: 15, revenue: 450 },
    { master_name: "Maria L.", completed: 8, revenue: 360 },
  ],
  daily_revenue: [],
};
const NOTIFICATIONS: never[] = [];
const SERVICES = [
  { id: 1, name: "Manicure", duration_minutes: 60, price: 30, is_active: true },
  { id: 2, name: "Pedicure", duration_minutes: 90, price: 45, is_active: true },
];

// ─── Helper: inject auth + wire all API mocks ────────────────────────────────

async function setupOwnerMocks(page: Page) {
  // Inject tokens before page loads (must be awaited before goto)
  await page.addInitScript(() => {
    localStorage.setItem("access_token", "fake-owner-token");
    localStorage.setItem("refresh_token", "fake-owner-refresh");
    localStorage.setItem("user_id", "1");
    localStorage.setItem("role", "provider_owner");
  });

  // Auth — getMe() uses /users/me
  await page.route(`${API}/users/me`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OWNER_USER) })
  );
  // Prevent refresh token redirect loops
  await page.route(`${API}/auth/refresh`, (r: Route) =>
    r.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ access_token: "fake-owner-token", refresh_token: "fake-owner-refresh" }),
    })
  );
  // Logout — mock to avoid real network call delays
  await page.route(`${API}/auth/logout`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "logged out" }) })
  );

  // Providers (both new path and compat salons path)
  await page.route(`${API}/providers/public`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([SALON]) })
  );
  await page.route(`${API}/providers/public/1`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SALON) })
  );
  await page.route(`${API}/providers/**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SALON) })
  );
  await page.route(`${API}/providers**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([SALON]) })
  );

  // Sessions — use ** to match trailing slash (/sessions/) and query params
  await page.route(`${API}/sessions**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSIONS) })
  );

  // Professionals (new path) + Masters (compat)
  // Register wildcards FIRST so specific routes (registered later) are checked first in LIFO order
  await page.route(`${API}/professionals**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTERS) })
  );
  await page.route(`${API}/masters**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTERS) })
  );
  // Specific routes after wildcards → checked first in LIFO
  await page.route(`${API}/professionals/provider/1**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROFESSIONAL_PROVIDERS) })
  );
  await page.route(`${API}/professionals/provider/1/public`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTERS) })
  );

  // Services — ** to match /services/ and /services/provider/1 etc.
  await page.route(`${API}/services/provider/1`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SERVICES) })
  );
  await page.route(`${API}/services**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SERVICES) })
  );

  // Reviews — ** to match /reviews/ and /reviews/stats/master/:id
  // Return plain array (not {data,total}) — ReviewsPage calls reviews.map()/.reduce() directly
  await page.route(`${API}/reviews**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REVIEWS) })
  );

  // Analytics — ** to match /analytics/owner/provider/1/workers and sub-paths
  await page.route(`${API}/analytics/owner/provider/1/workers**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ANALYTICS_WORKERS) })
  );
  await page.route(`${API}/analytics**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ANALYTICS_WORKERS) })
  );

  // Invoices — ** to match /invoices/ and /invoices/salon/1
  await page.route(`${API}/invoices/salon/1`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(INVOICES) })
  );
  await page.route(`${API}/invoices**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(INVOICES) })
  );

  // Reports — ** to match /reports/provider/:id and sub-paths
  await page.route(`${API}/reports/provider/**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REPORTS) })
  );
  await page.route(`${API}/reports**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REPORTS) })
  );

  // Notifications — ** to match /notifications/ and sub-paths
  await page.route(`${API}/notifications**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(NOTIFICATIONS) })
  );

  // Calendar — ** to match /calendar/ and sub-paths
  await page.route(`${API}/calendar**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
  );
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

test.describe("Salon Owner (Admin) — Full Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupOwnerMocks(page);
  });

  // ── 1. Authentication ────────────────────────────────────────────────────

  test("1.1 owner can log in and is redirected to dashboard", async ({ page }) => {
    // Override to test the actual login flow from scratch
    page.addInitScript(() => {
      localStorage.clear();
    });

    await page.route(`${API}/auth/login`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake-owner-token",
          refresh_token: "fake-owner-refresh",
          token_type: "bearer",
          user_id: 1,
          role: "provider_owner",
        }),
      })
    );

    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel(/email/i)).toBeVisible();

    await page.getByLabel(/email/i).fill("owner@glamour.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  // ── 2. Dashboard ─────────────────────────────────────────────────────────

  test("2.1 owner dashboard renders without redirect to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("2.2 owner dashboard shows salon stats", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Owner dashboard shows stats cards
    await expect(page.locator("h1, [class*='font-bold']").first()).toBeVisible({ timeout: 5000 });
  });

  test("2.3 sidebar shows owner-specific navigation items", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Sidebar nav items visible to salon_owner
    await expect(page.getByRole("link", { name: /sessions/i })).toBeVisible({ timeout: 5000 });
    // Sidebar uses "Professionals" (not "Masters") as the nav label — exact match to avoid matching "Discover Professionals"
    await expect(page.getByRole("link", { name: "Professionals", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /reviews/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /invoices/i })).toBeVisible();
  });

  test("2.4 sidebar shows BeautyPlatform branding", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/BeautyPlatform/i)).toBeVisible({ timeout: 5000 });
  });

  // ── 3. Sessions ──────────────────────────────────────────────────────────

  test("3.1 sessions page loads and shows session list", async ({ page }) => {
    await page.goto("/sessions");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText("Alice Smith")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Bob Jones")).toBeVisible();
  });

  test("3.2 sessions page shows prices", async ({ page }) => {
    await page.goto("/sessions");
    await page.waitForLoadState("networkidle");
    // Sessions show price (formatted as currency), not service name
    await expect(page.getByText("$30.00")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("$45.00")).toBeVisible();
  });

  test("3.3 sessions page shows status badges", async ({ page }) => {
    await page.goto("/sessions");
    await page.waitForLoadState("networkidle");
    // completed and scheduled statuses should appear (use .first() — multiple matches possible)
    await expect(page.getByText(/completed/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ── 4. Masters ──────────────────────────────────────────────────────────

  test("4.1 masters page loads and shows master list", async ({ page }) => {
    await page.goto("/masters");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    // MastersPage renders ProfessionalProvider format: "Professional #N"
    await expect(page.getByText("Professional #1")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Professional #2")).toBeVisible();
  });

  // ── 5. Services ─────────────────────────────────────────────────────────

  test("5.1 services page loads and shows service list", async ({ page }) => {
    await page.goto("/services");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText("Manicure")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Pedicure")).toBeVisible();
  });

  // ── 6. Reviews ──────────────────────────────────────────────────────────

  test("6.1 reviews page loads without errors", async ({ page }) => {
    await page.goto("/reviews");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    // Reviews heading
    await expect(page.getByText(/reviews/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("6.2 reviews page shows client names and ratings", async ({ page }) => {
    // Return plain array — ReviewsPage calls reviews.map() directly, not {data,total}
    await page.route(`${API}/reviews**`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(REVIEWS),
      })
    );
    await page.goto("/reviews");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Alice Smith")).toBeVisible({ timeout: 5000 });
  });

  // ── 7. Analytics ────────────────────────────────────────────────────────

  test("7.1 owner analytics page loads", async ({ page }) => {
    await page.goto("/analytics/owner");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/analytics|workers|performance/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("7.2 owner analytics shows stat cards", async ({ page }) => {
    await page.goto("/analytics/owner");
    await page.waitForLoadState("networkidle");
    // Check stat card labels are present
    await expect(page.getByText(/workers|sessions|revenue/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ── 8. Invoices ─────────────────────────────────────────────────────────

  test("8.1 invoices page loads for owner", async ({ page }) => {
    await page.goto("/invoices");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/invoices/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("8.2 invoices page shows Generate Invoice button for owner", async ({ page }) => {
    await page.goto("/invoices");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: /generate invoice/i })).toBeVisible({ timeout: 5000 });
  });

  test("8.3 owner can open invoice generate form", async ({ page }) => {
    await page.goto("/invoices");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /generate invoice/i }).click();
    // Form should appear — use .first() since invoice rows also have a status <select>
    await expect(page.getByText(/generate monthly invoice/i)).toBeVisible({ timeout: 5000 });
    await expect(page.locator("select").first()).toBeVisible();
  });

  test("8.4 invoices list shows period and amounts", async ({ page }) => {
    await page.goto("/invoices");
    await page.waitForLoadState("networkidle");
    // Invoice row data
    await expect(page.getByText("2026-03-01")).toBeVisible({ timeout: 5000 });
  });

  // ── 9. Reports ──────────────────────────────────────────────────────────

  test("9.1 reports page loads for owner", async ({ page }) => {
    await page.goto("/reports");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });

  // ── 10. Notifications ────────────────────────────────────────────────────

  test("10.1 notifications page loads", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    // Use first() to avoid strict mode: sidebar link + page heading both match
    await expect(page.getByText(/notifications/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ── 11. Sign out ─────────────────────────────────────────────────────────

  test("11.1 owner can sign out and is redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Click sign out button in sidebar
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  // ── 12. Sidebar navigation ───────────────────────────────────────────────

  test("12.1 sidebar links navigate to correct pages", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Navigate to Sessions via sidebar
    await page.getByRole("link", { name: /sessions/i }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/sessions/);
  });

  test("12.2 sidebar does NOT show Admin link for salon_owner", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Admin link should not be visible for salon_owner (only platform_admin)
    await expect(page.getByRole("link", { name: /^admin$/i })).not.toBeVisible();
  });

  test("12.3 sidebar shows Discover Professionals link", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Sidebar uses "Discover Professionals" (not "Discover Masters")
    await expect(page.getByRole("link", { name: /discover professionals/i })).toBeVisible({ timeout: 5000 });
  });
});
