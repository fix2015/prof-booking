import { test, expect } from "@playwright/test";

const API = "http://localhost:8000/api/v1";

test.describe("Auth", () => {
  test("unauthenticated root redirects to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("login with wrong credentials shows error", async ({ page }) => {
    // Mock API response for failed login
    await page.route(`${API}/auth/login`, (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Invalid credentials" }),
      })
    );

    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrongpass");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show error message (toast or inline)
    await expect(page.getByText(/invalid credentials|error|failed/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.route(`${API}/auth/login`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake-access-token",
          refresh_token: "fake-refresh-token",
          token_type: "bearer",
          user_id: 1,
          role: "salon_owner",
        }),
      })
    );
    await page.route(`${API}/auth/me`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          email: "owner@salon.com",
          role: "salon_owner",
          is_active: true,
        }),
      })
    );

    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(/email/i).fill("owner@salon.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test("register page renders owner form", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/salon name/i)).toBeVisible();
  });
});
