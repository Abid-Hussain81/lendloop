// Server-only callers use this flag; no secret value is passed to the browser.
export function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CONVEX_URL &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
}
