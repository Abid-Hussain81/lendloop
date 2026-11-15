import type { AuthConfig } from "convex/server";
const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;
export default {
  // No issuer means no token is accepted; public/offline setup stays fail-closed.
  providers: domain ? [{ domain, applicationID: "convex" }] : [],
} satisfies AuthConfig;
