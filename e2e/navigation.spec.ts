import { test, expect } from "@playwright/test";

test("navigation to pricing page from user avatar dropdown", async ({ page }) => {
  await page.goto("/");

  // Click on the user menu (UserAvatar)
  // Using aria-label as defined in UserAvatar.tsx: aria-label={t("user.menu")} -> "Menu"
  // Also finding by the icon container or button role directly
  const menuButton = page.getByRole("button", { name: "Menu" });
  await menuButton.click();

  // Wait for dropdown to be visible
  await expect(page.locator("div").filter({ hasText: "Pricing" }).first()).toBeVisible();

  // Check if Pricing link is visible in dropdown by HREF
  const pricingLink = page.locator("a[href='/pricing']");
  await expect(pricingLink).toBeVisible();

  // Click the Pricing link
  await pricingLink.click();

  // Verify navigation to pricing page
  await expect(page).toHaveURL("/pricing");
  await expect(page).toHaveTitle(/MyBias/);
  await expect(page.getByText("Choose Your Plan")).toBeVisible();
});
