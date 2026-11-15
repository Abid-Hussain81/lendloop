import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
import { isConfigured } from "./lib/config";
const protectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const middleware = clerkMiddleware(async (auth, req) => {
  if (protectedRoute(req)) await auth.protect();
});
export default function proxy(req: NextRequest, event: NextFetchEvent) {
  return isConfigured() ? middleware(req, event) : NextResponse.next();
}
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)",
    "/(api|trpc)(.*)",
  ],
};
