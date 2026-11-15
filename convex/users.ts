import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { identity, adminIdentity } from "./lib/auth";
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await identity(ctx);
    const profile = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", user.subject))
      .unique();
    return { ...user, trusted: profile?.trusted ?? false };
  },
});
export const setTrusted = mutation({
  args: { subject: v.string(), trusted: v.boolean() },
  handler: async (ctx, args) => {
    await adminIdentity(ctx);
    const lender = await ctx.db
      .query("tools")
      .withIndex("by_owner", (q) => q.eq("owner", args.subject))
      .first();
    if (!lender) throw new ConvexError("Lender not found.");
    const user = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", args.subject))
      .unique();
    if (user) await ctx.db.patch(user._id, { trusted: args.trusted });
    else await ctx.db.insert("users", args);
  },
});
