import { expect, test } from "@playwright/test";
test("visitor can browse the library and reach the appropriate sign-in state", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /The right tool\.\s*Already nearby\./ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explore the library" }).click();
  await expect(
    page.getByRole("heading", { name: "Find what you need." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.setup/landing-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Sign in to lend or borrow" }).click();
  await expect(
    page
      .getByRole("heading", { name: "The library is getting ready." })
      .or(page.locator(".cl-signIn-root")),
  ).toBeVisible({ timeout: 20000 });
  await page.getByRole("link", { name: "LendLoop home" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  expect(errors).toEqual([]);
});
