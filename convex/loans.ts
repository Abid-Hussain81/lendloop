import { query, mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { identity, adminIdentity } from "./lib/auth";
import { validateRange, overlaps } from "./lib/dates";
import { enqueue } from "./lib/events";

async function enrich(ctx: QueryCtx, loans: Doc<"loans">[]) {
  return Promise.all(
    loans.map(async (loan) => ({
      ...loan,
      toolName: (await ctx.db.get(loan.toolId))?.name ?? "Removed listing",
      activity: (
        await ctx.db
          .query("activity")
          .withIndex("by_loan", (q) => q.eq("loanId", loan._id))
          .order("desc")
          .take(5)
      ).map((item) => ({ kind: item.kind, at: item.at })),
    })),
  );
}
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await identity(ctx);
    return enrich(
      ctx,
      await ctx.db
        .query("loans")
        .withIndex("by_borrower", (q) => q.eq("borrower", user.subject))
        .order("desc")
        .take(100),
    );
  },
});
export const incoming = query({
  args: {},
  handler: async (ctx) => {
    const user = await identity(ctx);
    return enrich(
      ctx,
      await ctx.db
        .query("loans")
        .withIndex("by_lender", (q) => q.eq("lender", user.subject))
        .order("desc")
        .take(100),
    );
  },
});
export const all = query({
  args: {},
  handler: async (ctx) => {
    await adminIdentity(ctx);
    return enrich(ctx, await ctx.db.query("loans").order("desc").take(100));
  },
});
export const request = mutation({
  args: { toolId: v.id("tools"), start: v.string(), end: v.string() },
  handler: async (ctx, args) => {
    const user = await identity(ctx);
    const tool = await ctx.db.get(args.toolId);
    if (!tool || tool.archived || tool.owner === user.subject)
      throw new ConvexError("Choose an active listing from another lender.");
    validateRange(args.start, args.end);
    const id = await ctx.db.insert("loans", {
      ...args,
      lender: tool.owner,
      borrower: user.subject,
      status: "pending",
      updatedAt: Date.now(),
    });
    await enqueue(ctx, id, tool.owner, "request.created");
    return id;
  },
});
export const decide = mutation({
  args: { id: v.id("loans"), approve: v.boolean() },
  handler: async (ctx, { id, approve }) => {
    const user = await identity(ctx);
    const loan = await ctx.db.get(id);
    if (!loan || loan.lender !== user.subject || loan.status !== "pending")
      throw new ConvexError("Only the lender can decide a pending request.");
    if (approve) {
      const tool = await ctx.db.get(loan.toolId);
      if (!tool || tool.archived)
        throw new ConvexError("The listing has been removed.");
      validateRange(loan.start, loan.end);
      const others = await ctx.db
        .query("loans")
        .withIndex("by_tool", (q) => q.eq("toolId", loan.toolId))
        .collect();
      if (
        others.some(
          (other) => other.status === "approved" && overlaps(loan, other),
        )
      )
        throw new ConvexError("These dates are already reserved.");
    }
    await ctx.db.patch(id, {
      status: approve ? "approved" : "declined",
      updatedAt: Date.now(),
    });
    await enqueue(
      ctx,
      id,
      loan.borrower,
      approve ? "request.approved" : "request.declined",
    );
  },
});
export const returnLoan = mutation({
  args: { id: v.id("loans") },
  handler: async (ctx, { id }) => {
    const user = await identity(ctx);
    const loan = await ctx.db.get(id);
    if (
      !loan ||
      ![loan.lender, loan.borrower].includes(user.subject) ||
      loan.status !== "approved"
    )
      throw new ConvexError("Only a participant can return an approved loan.");
    await ctx.db.patch(id, { status: "returned", updatedAt: Date.now() });
    await enqueue(
      ctx,
      id,
      loan.lender === user.subject ? loan.borrower : loan.lender,
      "loan.returned",
    );
  },
});
