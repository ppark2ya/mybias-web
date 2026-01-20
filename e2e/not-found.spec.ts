import { test, expect } from "@playwright/test";

test("should show 404 page for non-existent routes", async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto("/some-random-page-that-does-not-exist");

    // Wait for the h1 to be visible to ensure page load
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("h1")).toContainText("404");

    // Check for the "Back to Home" button using href
    // We use first() because the logo might also link to home, but usually we want the explicit button
    // However, checking visibility of *any* link to / is a good start, but let's be specific to the button content if we can,
    // or just ensure we can click *a* link to go home.
    // Given the NotFound implementation: <Link to="/">... Back to Home ...</Link>
    const homeButton = page.locator("a[href='/']").filter({ hasText: /Back to Home|홈으로/ }).first();
    await expect(homeButton).toBeVisible();

    // Click the home button
    await homeButton.click();

    // Verify we are back home
    await expect(page).toHaveURL("/");
});
