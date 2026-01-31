import { test, expect } from "@playwright/test";

test.describe("Strona główna", () => {
  test("powinno załadować stronę główną", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/10xDevs/i);
  });

  test("powinno wyświetlić główne elementy nawigacji", async ({ page }) => {
    await page.goto("/");

    // Sprawdź czy nawigacja jest widoczna
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("powinno przekierować do strony logowania po kliknięciu przycisku", async ({ page }) => {
    await page.goto("/");

    // Znajdź przycisk logowania i kliknij
    const loginButton = page.getByRole("link", { name: /zaloguj/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });
});

test.describe("Responsywność", () => {
  test("powinno działać poprawnie na urządzeniach mobilnych", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page).toHaveTitle(/10xDevs/i);
  });

  test("powinno działać poprawnie na tabletach", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(page).toHaveTitle(/10xDevs/i);
  });
});
