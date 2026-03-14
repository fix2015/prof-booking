/**
 * E2E Tests — Client (Public) User Flow
 *
 * Covers the unauthenticated client journey:
 *   discover masters → view master profile → book appointment
 *   → salon selector → full booking form → confirmation
 *   Also: unauthenticated users redirected to login, not master pages
 */

import { test, expect, type Route } from "@playwright/test";

const API = "http://localhost:8000/api/v1";

// ─── Shared mock data ────────────────────────────────────────────────────────

const MASTERS_DISCOVER = [
  {
    id: 1, name: "Anna K.", bio: "Expert in gel nail art with 5 years of experience.",
    nationality: "French", experience_years: 5,
    avatar_url: null, photos: [],
    salon_id: 1,
  },
  {
    id: 2, name: "Maria L.", bio: "Specialist in nail extensions and nail art.",
    nationality: "Italian", experience_years: 3,
    avatar_url: null, photos: [],
    salon_id: 1,
  },
  {
    id: 3, name: "Sophie D.", bio: "Creative nail designer.",
    nationality: "Spanish", experience_years: 7,
    avatar_url: null, photos: [],
    salon_id: 2,
  },
];

const MASTER_1 = {
  id: 1, name: "Anna K.", bio: "Expert in gel nail art with 5 years of experience.",
  nationality: "French", experience_years: 5,
  avatar_url: null, photos: [], salon_id: 1,
};

const REVIEW_STATS_1 = {
  master_id: 1,
  total_reviews: 12,
  average_rating: 4.8,
  distribution: { "5": 10, "4": 2, "3": 0, "2": 0, "1": 0 },
};

const REVIEWS_MASTER_1 = {
  data: [
    {
      id: 1, client_name: "Alice Smith", rating: 5,
      comment: "Absolutely amazing!", is_published: true,
      created_at: "2026-03-10T12:00:00", master_id: 1, salon_id: 1,
    },
    {
      id: 2, client_name: "Carol White", rating: 5,
      comment: "Best nail artist in the city!", is_published: true,
      created_at: "2026-03-08T09:00:00", master_id: 1, salon_id: 1,
    },
  ],
  total: 2,
};

const SALONS = [
  { id: 1, name: "Glamour Nails", address: "123 Main St", is_active: true },
];

const SERVICES = [
  { id: 1, name: "Manicure", duration_minutes: 60, price: 30, is_active: true },
  { id: 2, name: "Pedicure", duration_minutes: 90, price: 45, is_active: true },
  { id: 3, name: "Gel Nails", duration_minutes: 75, price: 50, is_active: true },
];

const MASTERS_PUBLIC = [
  { id: 1, name: "Anna K.", bio: "5 years experience", avatar_url: null },
  { id: 2, name: "Maria L.", bio: "Nail extensions specialist", avatar_url: null },
];

const SLOTS = [
  {
    master_id: 1, master_name: "Anna K.",
    slot_date: "2026-03-20", start_time: "10:00:00", end_time: "11:00:00",
    work_slot_id: 5,
  },
  {
    master_id: 1, master_name: "Anna K.",
    slot_date: "2026-03-20", start_time: "14:00:00", end_time: "15:00:00",
    work_slot_id: 6,
  },
];

// ─── Test Suite: Master Discovery ────────────────────────────────────────────

test.describe("Client — Master Discovery", () => {
  test.beforeEach(async ({ page }) => {
    // Discovery is PUBLIC — no auth needed
    await page.route(`${API}/masters/discover*`, (r: Route) =>
      r.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify(MASTERS_DISCOVER),
      })
    );
    await page.route(`${API}/reviews/stats/master/*`, (r: Route) =>
      r.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify(REVIEW_STATS_1),
      })
    );
  });

  test("1.1 discover page is publicly accessible (no login required)", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("1.2 discover page shows heading", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/discover masters/i)).toBeVisible({ timeout: 5000 });
  });

  test("1.3 discover page shows master cards", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Anna K.")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Maria L.")).toBeVisible();
    await expect(page.getByText("Sophie D.")).toBeVisible();
  });

  test("1.4 discover page shows nationality on master cards", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("French")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Italian")).toBeVisible();
  });

  test("1.5 discover page shows experience years", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    // "5y" for 5 years experience
    await expect(page.getByText(/5y/i)).toBeVisible({ timeout: 5000 });
  });

  test("1.6 discover page shows View Profile and Book buttons", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: /view profile/i }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: /book/i }).first()).toBeVisible();
  });

  test("1.7 search input filters by name", async ({ page }) => {
    // Search returns only Anna
    await page.route(`${API}/masters/discover*`, (r: Route) => {
      const url = r.request().url();
      if (url.includes("search=Anna")) {
        return r.fulfill({
          status: 200, contentType: "application/json",
          body: JSON.stringify([MASTERS_DISCOVER[0]]),
        });
      }
      return r.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify(MASTERS_DISCOVER),
      });
    });

    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder(/search by name/i).fill("Anna");
    await page.getByRole("button", { name: /^search$/i }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Anna K.")).toBeVisible({ timeout: 5000 });
  });

  test("1.8 pressing Enter in search field triggers search", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    const searchInput = page.getByPlaceholder(/search by name/i);
    await searchInput.fill("Sophie");
    await searchInput.press("Enter");
    await page.waitForLoadState("networkidle");
    // No error, stays on discover page
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("1.9 clear button appears when filters are active", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder(/search by name/i).fill("test");
    await page.getByRole("button", { name: /^search$/i }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /clear/i })).toBeVisible({ timeout: 5000 });
  });

  test("1.10 empty state shows when no masters found", async ({ page }) => {
    await page.route(`${API}/masters/discover*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );

    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/no masters found/i)).toBeVisible({ timeout: 5000 });
  });

  test("1.11 clicking View Profile navigates to master profile page", async ({ page }) => {
    await page.route(`${API}/masters/1`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTER_1) })
    );
    await page.route(`${API}/reviews/stats/master/1`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REVIEW_STATS_1) })
    );
    await page.route(`${API}/reviews*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REVIEWS_MASTER_1) })
    );

    await page.goto("/discover");
    await page.waitForLoadState("networkidle");

    // Click first "View Profile" button
    await page.getByRole("link", { name: /view profile/i }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/masters\/1/, { timeout: 5000 });
  });
});

// ─── Test Suite: Master Profile ───────────────────────────────────────────────

test.describe("Client — Master Profile Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${API}/masters/1`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTER_1) })
    );
    await page.route(`${API}/reviews/stats/master/1`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REVIEW_STATS_1) })
    );
    await page.route(`${API}/reviews*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REVIEWS_MASTER_1) })
    );
  });

  test("2.1 master profile page is publicly accessible", async ({ page }) => {
    await page.goto("/masters/1");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("2.2 master profile shows master name", async ({ page }) => {
    await page.goto("/masters/1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Anna K.")).toBeVisible({ timeout: 5000 });
  });

  test("2.3 master profile shows nationality", async ({ page }) => {
    await page.goto("/masters/1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/french/i)).toBeVisible({ timeout: 5000 });
  });

  test("2.4 master profile shows experience years", async ({ page }) => {
    await page.goto("/masters/1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/5/)).toBeVisible({ timeout: 5000 });
  });

  test("2.5 master profile shows bio", async ({ page }) => {
    await page.goto("/masters/1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/expert in gel nail art/i)).toBeVisible({ timeout: 5000 });
  });

  test("2.6 master profile shows average rating", async ({ page }) => {
    await page.goto("/masters/1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/4\.8/)).toBeVisible({ timeout: 5000 });
  });

  test("2.7 master profile shows total review count", async ({ page }) => {
    await page.goto("/masters/1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/12/)).toBeVisible({ timeout: 5000 });
  });

  test("2.8 master profile shows client reviews", async ({ page }) => {
    await page.goto("/masters/1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Alice Smith")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/absolutely amazing/i)).toBeVisible();
  });

  test("2.9 master profile shows Book Appointment button", async ({ page }) => {
    await page.goto("/masters/1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /book appointment/i })).toBeVisible({ timeout: 5000 });
  });

  test("2.10 Book Appointment links to booking page with master_id", async ({ page }) => {
    await page.goto("/masters/1");
    await page.waitForLoadState("networkidle");

    const bookLink = page.getByRole("link", { name: /book appointment/i });
    const href = await bookLink.getAttribute("href");
    expect(href).toContain("master_id=1");
  });
});

// ─── Test Suite: Public Booking Flow ─────────────────────────────────────────

test.describe("Client — Full Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${API}/salons/public`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SALONS) })
    );
    await page.route(`${API}/salons/public/1`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SALONS[0]) })
    );
    await page.route(`${API}/services/salon/1`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SERVICES) })
    );
    await page.route(`${API}/masters/salon/1/public`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTERS_PUBLIC) })
    );
    await page.route(`${API}/calendar/availability*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SLOTS) })
    );
  });

  test("3.1 /salons page shows salon list publicly", async ({ page }) => {
    await page.goto("/salons");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText("Glamour Nails")).toBeVisible({ timeout: 5000 });
  });

  test("3.2 /book/1 shows service selection step", async ({ page }) => {
    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Manicure")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Pedicure")).toBeVisible();
    await expect(page.getByText("Gel Nails")).toBeVisible();
  });

  test("3.3 selecting a service shows master selection", async ({ page }) => {
    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");
    await page.getByText("Manicure").click();
    await expect(page.getByText("Anna K.")).toBeVisible({ timeout: 5000 });
  });

  test("3.4 selecting a master shows time slot picker", async ({ page }) => {
    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");
    await page.getByText("Manicure").click();
    await page.getByText("Anna K.").click();
    // Time slots should become visible
    await expect(page.getByText(/10:00/i)).toBeVisible({ timeout: 5000 });
  });

  test("3.5 full booking form submission shows confirmation", async ({ page }) => {
    await page.route(`${API}/booking/`, (r: Route) =>
      r.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          session_id: 42,
          client_name: "Jane Doe",
          salon_name: "Glamour Nails",
          service_name: "Manicure",
          starts_at: "2026-03-20T10:00:00",
          ends_at: "2026-03-20T11:00:00",
          price: 30.0,
          confirmation_code: "BEAUTY42",
        }),
      })
    );

    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");

    // Step 1: Service
    await page.getByText("Manicure").click();

    // Step 2: Master
    await page.getByText("Anna K.").click();

    // Step 3: Time slot
    await page.getByText(/10:00/i).click();

    // Step 4: Client info
    await page.getByLabel(/name/i).fill("Jane Doe");
    await page.getByLabel(/phone/i).fill("+1234567890");
    await page.getByLabel(/email/i).fill("jane@example.com");

    // Submit
    await page.getByRole("button", { name: /book|confirm/i }).click();

    // Confirmation
    await expect(page.getByText(/BEAUTY42|confirmed|success/i)).toBeVisible({ timeout: 5000 });
  });

  test("3.6 booking page shows service price", async ({ page }) => {
    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/30|45|50/)).toBeVisible({ timeout: 5000 });
  });

  test("3.7 booking page shows service duration", async ({ page }) => {
    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/60|90|75/)).toBeVisible({ timeout: 5000 });
  });
});

// ─── Test Suite: Unauthenticated Redirects ────────────────────────────────────

test.describe("Client — Unauthenticated Access Control", () => {
  test("4.1 unauthenticated root / redirects to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/login/);
  });

  test("4.2 unauthenticated /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/login/);
  });

  test("4.3 unauthenticated /sessions redirects to /login", async ({ page }) => {
    await page.goto("/sessions");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/login/);
  });

  test("4.4 unauthenticated /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/login/);
  });

  test("4.5 /discover is publicly accessible without login", async ({ page }) => {
    await page.route(`${API}/masters/discover*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("4.6 /masters/:id is publicly accessible without login", async ({ page }) => {
    await page.route(`${API}/masters/1`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTER_1) })
    );
    await page.route(`${API}/reviews*`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [], total: 0 }) })
    );
    await page.goto("/masters/1");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("4.7 /book/:salonId is publicly accessible without login", async ({ page }) => {
    await page.route(`${API}/salons/public/1`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SALONS[0]) })
    );
    await page.route(`${API}/services/salon/1`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SERVICES) })
    );
    await page.route(`${API}/masters/salon/1/public`, (r: Route) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTERS_PUBLIC) })
    );
    await page.goto("/book/1");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });
});

// ─── Test Suite: Login Page ───────────────────────────────────────────────────

test.describe("Client — Login Page", () => {
  test("5.1 login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("5.2 login shows error on wrong credentials", async ({ page }) => {
    await page.route(`${API}/auth/login`, (r: Route) =>
      r.fulfill({
        status: 401, contentType: "application/json",
        body: JSON.stringify({ detail: "Invalid credentials" }),
      })
    );

    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid credentials|error|failed/i)).toBeVisible({ timeout: 5000 });
  });

  test("5.3 login page has link to register", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /register|sign up|create account/i })).toBeVisible({
      timeout: 5000,
    });
  });
});
