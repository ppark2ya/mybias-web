
import { test, expect } from "@playwright/test";

test.describe("Credit History Page", () => {
  const MOCK_USER_ID = "test-user-id";
  const MOCK_PROJECT_REF = "jrcmmdaldnrllfvscjtn";

  // Mock data matching the types in src/api/credit-history/types.ts
  const mockTransactions = [
    {
      id: "tx-1",
      amount: -1,
      type: "usage",
      referenceId: "pred-123",
      description: "Magic Eraser Service",
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    },
    {
      id: "tx-2",
      amount: 100,
      type: "purchase",
      referenceId: "order-456",
      description: "Credit Pack (100)",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      id: "tx-3",
      amount: 10,
      type: "refund",
      referenceId: "refund-789",
      description: "Service Refund",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    },
  ];

  test.beforeEach(async ({ page }) => {
    // 1. Mock Supabase Auth User Endpoint
    // This intercepts calls to get user details (used by getSession/getUser)
    await page.route(`**/auth/v1/user`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: MOCK_USER_ID,
          aud: "authenticated",
          role: "authenticated",
          email: "test@example.com",
          app_metadata: { provider: "email" },
          user_metadata: { full_name: "Test User" },
          created_at: new Date().toISOString(),
        }),
      });
    });

    // 2. Mock Supabase Profiles Endpoint
    // AuthContext calls this to get user profile
    await page.route(`**/rest/v1/profiles*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: MOCK_USER_ID,
          email: "test@example.com",
          full_name: "Test User",
          credits: 10,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }), // Single object because .single() is used
      });
    });

    // 3. Mock the credit-history API
    await page.route("**/api/credit-history*", async (route) => {
      const url = new URL(route.request().url());
      const cursor = url.searchParams.get("cursor");

      if (!cursor) {
        // First page
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            transactions: mockTransactions,
            nextCursor: "next-page-cursor",
            hasMore: true,
          }),
        });
      } else {
        // Next page (simulate empty/end)
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            transactions: [{
              id: "p2-1",
              amount: -1,
              type: "usage",
              description: "Transaction Page 2",
              createdAt: new Date().toISOString(),
            }],
            nextCursor: null,
            hasMore: false,
          }),
        });
      }
    });

    // 4. Set LocalStorage directly to "prime" the session
    // This avoids the initial redirect flicker before network mock kicks in
    await page.addInitScript((val) => {
      const token = {
        access_token: "fake-jwt-token",
        refresh_token: "fake-refresh-token",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: {
          id: val.userId,
          aud: "authenticated",
          role: "authenticated",
          email: "test@example.com",
          user_metadata: { full_name: "Test User" }
        }
      };
      window.localStorage.setItem(`sb-${val.projectRef}-auth-token`, JSON.stringify(token));
    }, { projectRef: MOCK_PROJECT_REF, userId: MOCK_USER_ID });
  });

  test("should navigate to credit history from user menu", async ({ page }) => {
    await page.goto("/");

    // Open User Menu
    const menuButton = page.getByRole("button", { name: /menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Click Credit History
    const creditHistoryLink = page.getByRole("link", { name: "Credit History" });
    // Fallback if i18n key is used differently, verify "Credit History" text exists
    await expect(creditHistoryLink).toBeVisible();
    await creditHistoryLink.click();

    // Assert URL
    await expect(page).toHaveURL("/credit-history");

    // Check Title
    await expect(page.getByRole("heading", { name: "Credit History" })).toBeVisible();
  });

  test("should display transaction list correctly", async ({ page }) => {
    await page.goto("/credit-history");

    // Check Usage Item
    const usageItem = page.getByText("Magic Eraser Service");
    await expect(usageItem).toBeVisible();

    // Check Purchase Item
    const purchaseItem = page.getByText("Credit Pack (100)");
    await expect(purchaseItem).toBeVisible();

    // Check Refund Item
    const refundItem = page.getByText("Service Refund");
    await expect(refundItem).toBeVisible();
  });

  test("should handle empty state", async ({ page }) => {
    // Override the mock for this specific test
    await page.route("**/api/credit-history*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transactions: [], nextCursor: null, hasMore: false }),
      });
    });

    await page.goto("/credit-history");
    await expect(page.getByText("No credit history")).toBeVisible();
    await expect(page.getByRole("link", { name: "Buy Credits" })).toBeVisible();
  });

  test("should load more on infinite scroll", async ({ page }) => {
    // Setup Page 1 with many items to ensure scrollability
    await page.route("**/api/credit-history*", async (route) => {
      const url = new URL(route.request().url());
      const cursor = url.searchParams.get("cursor");

      if (!cursor) {
        // Page 1
        await route.fulfill({
          json: {
            transactions: Array(20).fill(null).map((_, i) => ({
              id: `p1-${i}`,
              amount: -1,
              type: "usage",
              description: `Transaction P1-${i}`,
              createdAt: new Date().toISOString(),
            })),
            nextCursor: "page-2",
            hasMore: true,
          }
        });
      } else {
        // Page 2
        await route.fulfill({
          json: {
            transactions: [{
              id: "p2-1",
              amount: -1,
              type: "usage",
              description: "Transaction Page 2",
              createdAt: new Date().toISOString(),
            }],
            nextCursor: null,
            hasMore: false,
          }
        });
      }
    });

    await page.goto("/credit-history");

    // Verify Page 1 loaded
    await expect(page.getByText("Transaction P1-0")).toBeVisible();
    await expect(page.getByText("Transaction Page 2")).not.toBeVisible();

    // Scroll to bottom
    // We scroll the window or the scrollable container. Start with window.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for network request and render
    await expect(page.getByText("Transaction Page 2")).toBeVisible({ timeout: 5000 });
  });
});
