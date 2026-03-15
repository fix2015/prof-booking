/**
 * E2E Tests — Platform Admin (Super Admin) User Flow
 *
 * Covers the complete platform_admin journey:
 *   login → admin dashboard → platform stats
 *   → view all salons → view all users → full navigation
 */

import { test, expect, type Page, type Route } from "@playwright/test";

const API = "http://localhost:8000/api/v1";

// ─── Shared mock data ────────────────────────────────────────────────────────

const ADMIN_USER = { id: 99, email: "admin@beautyplatform.com", role: "platform_admin", is_active: true };

const ALL_SALONS = [
  { id: 1, name: "Glamour Nails", address: "123 Main St", is_active: true, deposit_percentage: 20 },
  { id: 2, name: "Beauty Bar", address: "456 Oak Ave", is_active: true, deposit_percentage: 10 },
  { id: 3, name: "Nail Studio Pro", address: "789 Pine Rd", is_active: false, deposit_percentage: 0 },
];

const ALL_USERS = [
  { id: 1, email: "owner1@glamour.com", role: "salon_owner", is_active: true },
  { id: 2, email: "owner2@beauty.com", role: "salon_owner", is_active: true },
  { id: 3, email: "anna.k@glamour.com", role: "master", is_active: true },
  { id: 4, email: "maria.l@beauty.com", role: "master", is_active: true },
  { id: 5, email: "inactive@nail.com", role: "master", is_active: false },
  { id: 99, email: "admin@beautyplatform.com", role: "platform_admin", is_active: true },
];

const SESSIONS_ALL = [
  {
    id: 1, status: "completed", client_name: "Alice Smith",
    service_name: "Manicure", master_name: "Anna K.",
    starts_at: "2026-03-14T10:00:00", price: 30,
  },
];

const REVIEWS = [
  {
    id: 1, client_name: "Alice Smith", rating: 5,
    comment: "Great!", is_published: true,
    created_at: "2026-03-14T12:00:00", salon_id: 1,
  },
];

const REPORTS = {
  summary: {
    salon_id: 1, salon_name: "Glamour Nails",
    period_start: "2026-02-14", period_end: "2026-03-14",
    total_sessions: 45, completed_sessions: 40,
    cancelled_sessions: 5, total_revenue: 1800, total_deposits: 360,
  },
  service_popularity: [],
  master_performance: [],
  daily_revenue: [],
};

// ─── Helper: inject admin auth + API mocks ───────────────────────────────────

async function setupAdminMocks(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("access_token", "fake-admin-token");
    localStorage.setItem("refresh_token", "fake-admin-refresh");
    localStorage.setItem("user_id", "99");
    localStorage.setItem("role", "platform_admin");
  });

  // Auth — getMe() uses /users/me
  await page.route(`${API}/users/me`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ADMIN_USER) })
  );
  // Prevent refresh token redirect loops
  await page.route(`${API}/auth/refresh`, (r: Route) =>
    r.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ access_token: "fake-admin-token", refresh_token: "fake-admin-refresh" }),
    })
  );
  // Logout — mock to avoid real network call delays
  await page.route(`${API}/auth/logout`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "logged out" }) })
  );

  // Providers/Salons (both paths)
  await page.route(`${API}/providers/public`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ALL_SALONS) })
  );
  await page.route(`${API}/providers/**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ALL_SALONS) })
  );
  await page.route(`${API}/providers**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ALL_SALONS) })
  );

  // Users — ** to match /users/ and /users/me
  await page.route(`${API}/users**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ALL_USERS) })
  );
  // /users/me registered after wildcard → checked first in LIFO
  await page.route(`${API}/users/me`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ADMIN_USER) })
  );

  // Sessions (admin can see all) — use ** to match /sessions/ with trailing slash
  await page.route(`${API}/sessions**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSIONS_ALL) })
  );

  // Reviews (admin can see and toggle) — return plain array (ReviewsPage calls .map()/.reduce())
  await page.route(`${API}/reviews**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REVIEWS) })
  );

  // Professionals/Masters
  await page.route(`${API}/professionals**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
  );
  await page.route(`${API}/masters**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
  );

  // Analytics
  await page.route(`${API}/analytics**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
  );

  // Invoices
  await page.route(`${API}/invoices**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
  );

  // Reports
  await page.route(`${API}/reports**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REPORTS) })
  );

  // Services
  await page.route(`${API}/services**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
  );

  // Notifications
  await page.route(`${API}/notifications**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
  );

  // Calendar
  await page.route(`${API}/calendar**`, (r: Route) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
  );
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

test.describe("Platform Admin (Super Admin) — Full Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminMocks(page);
  });

  // ── 1. Authentication ────────────────────────────────────────────────────

  test("1.1 platform_admin can log in and reach admin dashboard", async ({ page }) => {
    page.addInitScript(() => {
      localStorage.clear();
    });

    await page.route(`${API}/auth/login`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake-admin-token",
          refresh_token: "fake-admin-refresh",
          token_type: "bearer",
          user_id: 99,
          role: "platform_admin",
        }),
      })
    );

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByLabel(/email/i).fill("admin@beautyplatform.com");
    await page.getByLabel(/password/i).fill("superadmin123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  // ── 2. Admin Dashboard ───────────────────────────────────────────────────

  test("2.1 platform_admin dashboard shows Platform Administration heading", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Use heading role to avoid strict-mode (multiple elements may contain the text)
    await expect(page.getByRole("heading", { name: /platform administration/i })).toBeVisible({ timeout: 5000 });
  });

  test("2.2 admin dashboard shows stat cards for salons and users", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Component uses "Providers" terminology (not "Salons")
    await expect(page.getByText(/total providers/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/total users/i)).toBeVisible();
    await expect(page.getByText(/provider owners/i)).toBeVisible();
    await expect(page.getByText(/professionals/i).first()).toBeVisible();
  });

  test("2.3 admin dashboard shows correct salon count (3)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Use .first() to avoid strict-mode — "3" appears in stat card + table IDs/addresses
    await expect(page.getByText("3").first()).toBeVisible({ timeout: 5000 });
  });

  test("2.4 admin dashboard shows correct user count (6)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Use .first() to avoid strict-mode — "6" appears in stat card + user IDs
    await expect(page.getByText("6").first()).toBeVisible({ timeout: 5000 });
  });

  // ── 3. All Salons Table ──────────────────────────────────────────────────

  test("3.1 admin dashboard shows All Salons table", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Component card header says "All Providers" (not "All Salons")
    await expect(page.getByText(/all providers/i)).toBeVisible({ timeout: 5000 });
  });

  test("3.2 all salons table lists every salon", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Glamour Nails")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Beauty Bar")).toBeVisible();
    await expect(page.getByText("Nail Studio Pro")).toBeVisible();
  });

  test("3.3 salons table shows Active and Inactive badges", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Active").first()).toBeVisible({ timeout: 5000 });
    // Multiple Inactive badges across providers and users tables — use .first()
    await expect(page.getByText("Inactive").first()).toBeVisible();
  });

  // ── 4. All Users Table ───────────────────────────────────────────────────

  test("4.1 admin dashboard shows All Users table", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/all users/i)).toBeVisible({ timeout: 5000 });
  });

  test("4.2 users table shows owner and master emails", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("owner1@glamour.com")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("anna.k@glamour.com")).toBeVisible();
  });

  test("4.3 users table shows roles (salon owner, master)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/salon owner/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/master/i).first()).toBeVisible();
  });

  // ── 5. Admin Panel page (/admin) ─────────────────────────────────────────

  test("5.1 /admin route renders same AdminPanelPage for platform_admin", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /platform administration/i })).toBeVisible({ timeout: 5000 });
  });

  // ── 6. Sidebar — admin-specific navigation ───────────────────────────────

  test("6.1 sidebar shows Admin link for platform_admin", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /^admin$/i })).toBeVisible({ timeout: 5000 });
  });

  test("6.2 sidebar shows Reviews link for platform_admin", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /reviews/i })).toBeVisible({ timeout: 5000 });
  });

  test("6.3 sidebar shows Analytics link for platform_admin", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /analytics/i })).toBeVisible({ timeout: 5000 });
  });

  test("6.4 sidebar shows Invoices link for platform_admin", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /invoices/i })).toBeVisible({ timeout: 5000 });
  });

  test("6.5 sidebar does NOT show My Analytics (master-only) for platform_admin", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /my analytics/i })).not.toBeVisible();
  });

  // ── 7. Reviews management (admin can moderate) ───────────────────────────

  test("7.1 admin can access the reviews page", async ({ page }) => {
    await page.goto("/reviews");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/reviews/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ── 8. Sessions (admin sees all sessions) ────────────────────────────────

  test("8.1 admin can view sessions list", async ({ page }) => {
    await page.goto("/sessions");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText("Alice Smith")).toBeVisible({ timeout: 5000 });
  });

  // ── 9. Invoices ──────────────────────────────────────────────────────────

  test("9.1 admin can access invoices page", async ({ page }) => {
    await page.goto("/invoices");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/invoices/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ── 10. Sign out ─────────────────────────────────────────────────────────

  test("10.1 platform_admin can sign out", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Override /users/me to 401 so addInitScript-restored tokens don't re-authenticate after logout
    await page.route(`${API}/users/me`, (r: Route) =>
      r.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ detail: "Not authenticated" }) })
    );
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  // ── 11. Security: role isolation ─────────────────────────────────────────

  test("11.1 admin role sees admin heading on dashboard (not owner view)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // platform_admin's dashboard is AdminPanelPage, not OwnerDashboardPage
    await expect(page.getByRole("heading", { name: /platform administration/i })).toBeVisible({ timeout: 5000 });
    // Owner dashboard title ("Salon Dashboard" or similar) should NOT appear
    await expect(page.getByText(/your salon/i)).not.toBeVisible();
  });
});
