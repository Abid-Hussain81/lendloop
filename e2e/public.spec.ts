import { expect, test } from "@playwright/test";
test("visitor can browse the page and reach an honest sign-in setup state", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good tools. Better neighbors." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explore the library" }).click();
  await expect(
    page.getByRole("heading", { name: "What’s in the neighborhood?" }),
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
    page.getByRole("heading", { name: "The library is getting ready." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to LendLoop" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  expect(errors).toEqual([]);
});
