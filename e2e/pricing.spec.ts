import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/pricing");

  // Expect a title "to contain" a substring.
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/MyBias/);
});

test("pricing cards are visible", async ({ page }) => {
  await page.goto("/pricing");

  // Check for the presence of pricing plans
  await expect(page.getByText("Free", { exact: true })).toBeVisible();
  await expect(page.getByText("Starter", { exact: true })).toBeVisible();
  await expect(page.getByText("Pro", { exact: true })).toBeVisible();
  await expect(page.getByText("Master", { exact: true })).toBeVisible();
});

test("navigation back to home", async ({ page }) => {
  await page.goto("/pricing");
  // Click the back link
  await page.getByRole("link", { name: /Back/i }).click();
  // Expects the URL to be the home page
  await expect(page).toHaveURL("/");
});
