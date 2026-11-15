import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";

export function isAdmin(subject: string): boolean {
  return (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(subject);
}

export async function identity(ctx: Pick<QueryCtx, "auth">) {
  const user = await ctx.auth.getUserIdentity();
  if (!user) throw new ConvexError("Please sign in to continue.");
  return {
    subject: user.subject,
    role: isAdmin(user.subject) ? ("admin" as const) : ("user" as const),
  };
}

export async function adminIdentity(ctx: Pick<QueryCtx, "auth">) {
  const user = await identity(ctx);
  if (user.role !== "admin")
    throw new ConvexError("Administrator access required.");
  return user;
}
