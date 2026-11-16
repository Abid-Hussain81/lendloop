import { expect, test } from "@playwright/test";

test("direct signed-out dashboard requests use the local sign-in page", async ({
  request,
  baseURL,
}) => {
  const response = await request.get("/dashboard", { maxRedirects: 0 });
  if (response.status() === 200) {
    test.skip(
      (await response.text()).includes("The library is getting ready."),
      "Clerk routing requires configured development credentials.",
    );
  }

  expect(response.status()).toBe(307);
  const location = response.headers().location;
  expect(location).toBeTruthy();
  const target = new URL(location, baseURL);
  expect(target.origin).toBe(new URL(baseURL!).origin);
  expect(target.pathname).toBe("/sign-in");
  const returnTo = new URL(target.searchParams.get("redirect_url")!);
  expect(returnTo.origin).toBe(new URL(baseURL!).origin);
  expect(returnTo.pathname).toBe("/dashboard");
});
