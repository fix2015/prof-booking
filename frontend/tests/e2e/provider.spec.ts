/**
 * E2E Tests — Provider (Salon) Pages
 *
 * Covers:
 *   /providers          — Public provider listing (SalonSelectorPage)
 *   /profile/provider   — Provider Settings form (SalonProfileEditPage)
 *   /discover           — Discover Professionals (MasterDiscoveryPage)
 */

import { test, expect, type Page, type Route } from "@playwright/test";

const API = "http://localhost:8000/api/v1";

// ─── Mock data ────────────────────────────────────────────────────────────────

const PROVIDERS = [
  {
    id: 1,
    name: "Glamour Nails",
    address: "123 Main St, Paris",
    phone: "+33 1 23 45 67 89",
    email: "glamour@nails.com",
    description: "Premium nail salon specializing in gel and manicure",
    is_active: true,
    deposit_percentage: 20,
    latitude: 48.8566,
    longitude: 2.3522,
    logo_url: null,
  },
  {
    id: 2,
    name: "Belle Ongles",
    address: "456 Rue de Rivoli, Paris",
    phone: "+33 1 98 76 54 32",
    email: "belle@ongles.com",
    description: "Acrylic and nail art studio",
    is_active: true,
    deposit_percentage: 15,
    latitude: null,
    longitude: null,
    logo_url: null,
  },
];

const PROFESSIONALS = [
  {
    id: 1,
    name: "Sophie Martin",
    nationality: "French",
    experience_years: 5,
    bio: "Expert in gel nails and nail art with 5 years of experience.",
    avatar_url: null,
    photos: [],
  },
  {
    id: 2,
    name: "Elena Rossi",
    nationality: "Italian",
    experience_years: 3,
    bio: "Specializes in acrylic extensions and pedicures.",
    avatar_url: null,
    photos: [],
  },
];

const OWNER_USER = {
  id: 1,
  email: "owner@glamour.com",
  role: "provider_owner",
  is_active: true,
};

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function setupAuthMocks(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("access_token", "fake-owner-token");
    localStorage.setItem("refresh_token", "fake-owner-refresh");
    localStorage.setItem("user_id", "1");
    localStorage.setItem("role", "provider_owner");
  });

  await page.route(`${API}/users/me`, (r: Route) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(OWNER_USER),
    })
  );

  await page.route(`${API}/auth/refresh`, (r: Route) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "fake-owner-token",
        refresh_token: "fake-owner-refresh",
      }),
    })
  );

  await page.route(`${API}/auth/logout`, (r: Route) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "logged out" }),
    })
  );
}

// ─── Provider listing mocks ───────────────────────────────────────────────────

async function setupProvidersMock(page: Page) {
  await page.route(`${API}/providers/public`, (r: Route) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(PROVIDERS),
    })
  );
  await page.route(`${API}/providers**`, (r: Route) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(PROVIDERS),
    })
  );
}

// ─── Professionals mock ───────────────────────────────────────────────────────

async function setupProfessionalsMock(page: Page) {
  await page.route(`${API}/professionals/discover**`, (r: Route) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(PROFESSIONALS),
    })
  );
  await page.route(`${API}/professionals**`, (r: Route) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(PROFESSIONALS),
    })
  );
  // Review stats per professional
  await page.route(`${API}/reviews/stats/master/**`, (r: Route) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total_reviews: 0, average_rating: 0 }),
    })
  );
  await page.route(`${API}/reviews**`, (r: Route) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    })
  );
}

// ─── 1. Public Provider Listing (/providers) ─────────────────────────────────

test.describe("Provider Listing Page (/providers)", () => {
  test.beforeEach(async ({ page }) => {
    await setupProvidersMock(page);
  });

  test("1.1 page renders Find Your Provider heading", async ({ page }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/find your provider/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("1.2 provider cards are displayed", async ({ page }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Glamour Nails")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Belle Ongles")).toBeVisible();
  });

  test("1.3 provider card shows address", async ({ page }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("123 Main St, Paris")).toBeVisible({
      timeout: 5000,
    });
  });

  test("1.4 each card has a Book Now link", async ({ page }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");
    const bookLinks = page.getByRole("link", { name: /book now/i });
    await expect(bookLinks.first()).toBeVisible({ timeout: 5000 });
  });

  test("1.5 search input filters providers by name", async ({ page }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");

    // Both providers visible initially
    await expect(page.getByText("Glamour Nails")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Belle Ongles")).toBeVisible();

    // Type in search box
    await page
      .getByPlaceholder(/search by name or address/i)
      .fill("Glamour");
    // After filtering only Glamour Nails should remain visible in the list
    await expect(page.getByText("Glamour Nails")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Belle Ongles")).not.toBeVisible();
  });

  test("1.6 view toggle buttons are present (Split / Map / List)", async ({
    page,
  }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: /split/i })).toBeVisible({
      timeout: 5000,
    });
    // Map and List icons rendered as SVGs inside buttons — check by accessible label or aria
    const buttons = page.getByRole("button");
    await expect(buttons.first()).toBeVisible();
  });

  test("1.7 service type chips are displayed", async ({ page }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Manicure")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Pedicure")).toBeVisible();
    await expect(page.getByText("Gel Nails")).toBeVisible();
  });

  test("1.8 clicking a service type chip highlights it", async ({ page }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");

    const chip = page.getByText("Manicure");
    await chip.click();
    // After click the chip should have the active class (pink background)
    await expect(chip).toHaveClass(/bg-pink-600/, { timeout: 3000 });
  });

  test("1.9 map unavailable message shown when no Maps API key", async ({
    page,
  }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");
    // Without VITE_GOOGLE_MAPS_API_KEY the fallback message appears
    await expect(page.getByText(/map unavailable/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("1.10 switching to list view hides the map panel", async ({ page }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");

    // Click the List button (last of the three view toggles)
    page.getByRole("button").filter({ hasText: "" }).nth(2);
    // Use aria / accessible name approach instead — List icon button
    // The List button is a small icon button; click by position
    await page.getByRole("button", { name: /split/i }).waitFor();
    // The buttons are: Split, Map (icon), List (icon) — find by locator index
    const viewButtons = page.locator("button").filter({ hasText: /split/i });
    await viewButtons.waitFor();

    // Click the list icon button (third toggle)
    const toggleArea = page.locator("div.flex.gap-1");
    await toggleArea.waitFor({ timeout: 5000 });
    const toggleBtns = toggleArea.getByRole("button");
    await toggleBtns.nth(2).click(); // List

    // Map panel should be hidden
    await expect(page.getByText(/map unavailable/i)).not.toBeVisible();
    // Provider list still visible
    await expect(page.getByText("Glamour Nails")).toBeVisible();
  });

  test("1.11 clear all filters button appears after typing in search", async ({
    page,
  }) => {
    await page.goto("/providers");
    await page.waitForLoadState("networkidle");

    await page
      .getByPlaceholder(/search by name or address/i)
      .fill("test");
    await expect(
      page.getByRole("button", { name: /clear all/i })
    ).toBeVisible({ timeout: 3000 });
  });
});

// ─── 2. Provider Settings Page (/profile/provider) ───────────────────────────

test.describe("Provider Settings Page (/profile/provider)", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
    await setupProvidersMock(page);
  });

  test("2.1 page loads and shows Provider Settings heading", async ({
    page,
  }) => {
    await page.goto("/profile/provider");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/provider settings/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("2.2 form fields are pre-filled with provider data", async ({
    page,
  }) => {
    await page.goto("/profile/provider");
    await page.waitForLoadState("networkidle");
    await expect(page.getByDisplayValue("Glamour Nails")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByDisplayValue("123 Main St, Paris")).toBeVisible();
  });

  test("2.3 form shows phone and email fields", async ({ page }) => {
    await page.goto("/profile/provider");
    await page.waitForLoadState("networkidle");
    await expect(page.getByDisplayValue("+33 1 23 45 67 89")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByDisplayValue("glamour@nails.com")).toBeVisible();
  });

  test("2.4 Save Changes button is present", async ({ page }) => {
    await page.goto("/profile/provider");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /save changes/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("2.5 provider logo section is shown", async ({ page }) => {
    await page.goto("/profile/provider");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/provider logo/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("2.6 Provider Information card is shown", async ({ page }) => {
    await page.goto("/profile/provider");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/provider information/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("2.7 user can edit the provider name field", async ({ page }) => {
    await page.goto("/profile/provider");
    await page.waitForLoadState("networkidle");

    const nameInput = page.getByDisplayValue("Glamour Nails");
    await nameInput.triple_click?.();
    await nameInput.fill("Updated Salon Name");
    await expect(nameInput).toHaveValue("Updated Salon Name");
  });

  test("2.8 submitting form calls PATCH /providers/:id", async ({ page }) => {
    let patchCalled = false;
    await page.route(`${API}/providers/1`, (r: Route) => {
      if (r.request().method() === "PATCH") {
        patchCalled = true;
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...PROVIDERS[0], name: "Updated Salon Name" }),
        });
      } else {
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(PROVIDERS[0]),
        });
      }
    });

    await page.goto("/profile/provider");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(async () => {
      expect(patchCalled).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test("2.9 description textarea is editable", async ({ page }) => {
    await page.goto("/profile/provider");
    await page.waitForLoadState("networkidle");

    const textarea = page.getByPlaceholder(/describe your provider/i);
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill("New description for testing purposes.");
    await expect(textarea).toHaveValue("New description for testing purposes.");
  });
});

// ─── 3. Discover Professionals (/discover) ────────────────────────────────────

test.describe("Discover Professionals Page (/discover)", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
    await setupProfessionalsMock(page);
  });

  test("3.1 page renders Discover Professionals heading", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/discover professionals/i).first()).toBeVisible(
      { timeout: 5000 }
    );
  });

  test("3.2 professional cards are shown", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Sophie Martin")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Elena Rossi")).toBeVisible();
  });

  test("3.3 professional nationality is displayed", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("French")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Italian")).toBeVisible();
  });

  test("3.4 experience years are displayed", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/5y/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/3y/)).toBeVisible();
  });

  test("3.5 each professional card has View Profile and Book buttons", async ({
    page,
  }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("link", { name: /view profile/i }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("link", { name: /book/i }).first()
    ).toBeVisible();
  });

  test("3.6 search input is present", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByPlaceholder(/search by name/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("3.7 nationality filter input is present", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByPlaceholder(/nationality/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("3.8 min experience filter input is present", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByPlaceholder(/min experience/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("3.9 Search button triggers API call", async ({ page }) => {
    let discoverCalled = false;
    await page.route(`${API}/professionals/discover**`, (r: Route) => {
      discoverCalled = true;
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(PROFESSIONALS),
      });
    });

    await page.goto("/discover");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder(/search by name/i).fill("Sophie");
    await page.getByRole("button", { name: /^search$/i }).click();

    await expect(async () => {
      expect(discoverCalled).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test("3.10 empty state message shown when no professionals found", async ({
    page,
  }) => {
    await page.route(`${API}/professionals/discover**`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );
    await page.route(`${API}/professionals**`, (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );

    await page.goto("/discover");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/no professionals found/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("3.11 Clear button appears after applying filters", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder(/nationality/i).fill("French");
    await page.getByRole("button", { name: /^search$/i }).click();

    await expect(
      page.getByRole("button", { name: /clear/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("3.12 View Profile link points to /professionals/:id", async ({
    page,
  }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");

    const profileLink = page
      .getByRole("link", { name: /view profile/i })
      .first();
    const href = await profileLink.getAttribute("href");
    expect(href).toMatch(/\/professionals\/\d+/);
  });
});
