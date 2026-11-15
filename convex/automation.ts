import { internalMutation, internalQuery, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { adminIdentity } from "./lib/auth";
import { today } from "./lib/dates";
export const notification = internalMutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new ConvexError("Event not found.");
    const key = `notification:${eventId}`;
    const previous = await ctx.db
      .query("activity")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (previous) return { acknowledged: true, duplicate: true };
    await ctx.db.insert("activity", {
      key,
      loanId: event.loanId,
      kind: "Mock request notification recorded",
      at: Date.now(),
    });
    await ctx.db.patch(eventId, { state: "delivered", failure: undefined });
    return { acknowledged: true, duplicate: false };
  },
});
export const reminder = internalMutation({
  args: { loanId: v.id("loans"), day: v.string() },
  handler: async (ctx, { loanId, day }) => {
    if (day !== today())
      throw new ConvexError("Reminder day must be today in UTC.");
    const key = `reminder:${loanId}:${day}`;
    if (
      await ctx.db
        .query("activity")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique()
    )
      return { duplicate: true };
    const loan = await ctx.db.get(loanId);
    if (!loan || loan.status !== "approved" || loan.end >= day)
      return { skipped: true, duplicate: false };
    await ctx.db.insert("activity", {
      key,
      loanId,
      kind: "Mock overdue reminder recorded",
      at: Date.now(),
    });
    return { duplicate: false };
  },
});
export const overdue = internalQuery({
  args: {},
  handler: async (ctx) => {
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();
    const result = [];
    for (const loan of loans) {
      if (loan.end >= today()) continue;
      const key = `reminder:${loan._id}:${today()}`;
      if (
        !(await ctx.db
          .query("activity")
          .withIndex("by_key", (q) => q.eq("key", key))
          .unique())
      )
        result.push({ loanId: loan._id, day: today() });
      if (result.length === 100) break;
    }
    return result;
  },
});
export const consumeRequest = internalMutation({
  args: { requestId: v.string() },
  handler: async (ctx, { requestId }) => {
    if (!/^[a-zA-Z0-9_-]{8,100}$/.test(requestId))
      throw new ConvexError("Invalid request ID.");
    if (
      await ctx.db
        .query("integrationRequests")
        .withIndex("by_key", (q) => q.eq("key", requestId))
        .unique()
    )
      return false;
    await ctx.db.insert("integrationRequests", {
      key: requestId,
      expiresAt: Date.now() + 600_000,
    });
    return true;
  },
});
export const claimBatch = internalMutation({
  args: {},
  handler: async (ctx) => {
    const due = await ctx.db
      .query("events")
      .withIndex("by_state_due", (q) =>
        q.eq("state", "pending").lte("nextAttempt", Date.now()),
      )
      .take(10);
    const result = [];
    for (const event of due) {
      if (event.attempts >= 5) {
        await ctx.db.patch(event._id, {
          state: "failed",
          failure: "retry_exhausted",
        });
        continue;
      }
      const attempts = event.attempts + 1;
      await ctx.db.patch(event._id, {
        attempts,
        nextAttempt: Date.now() + Math.min(3_600_000, 60_000 * 2 ** attempts),
      });
      result.push({ ...event, attempts });
    }
    return result;
  },
});
export const failedAttempt = internalMutation({
  args: { id: v.id("events") },
  handler: async (ctx, { id }) => {
    const event = await ctx.db.get(id);
    if (event && event.state === "pending")
      await ctx.db.patch(id, {
        failure: "delivery_failed",
        state: event.attempts >= 5 ? "failed" : "pending",
      });
  },
});
export const failure = internalMutation({
  args: { key: v.string(), workflow: v.string() },
  handler: async (ctx, args) => {
    if (
      !/^[a-zA-Z0-9_-]{1,100}$/.test(args.key) ||
      !["notification", "overdue", "unknown"].includes(args.workflow)
    )
      throw new ConvexError("Invalid failure metadata.");
    if (
      !(await ctx.db
        .query("failures")
        .withIndex("by_key", (q) => q.eq("key", args.key))
        .unique())
    )
      await ctx.db.insert("failures", { ...args, at: Date.now() });
    return { recorded: true };
  },
});
export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("integrationRequests")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", Date.now()))
      .take(500);
    for (const record of expired) await ctx.db.delete(record._id);
  },
});
export const health = query({
  args: {},
  handler: async (ctx) => {
    await adminIdentity(ctx);
    return {
      pending: (
        await ctx.db
          .query("events")
          .withIndex("by_state_due", (q) => q.eq("state", "pending"))
          .take(100)
      ).length,
      failed: await ctx.db
        .query("events")
        .withIndex("by_state_due", (q) => q.eq("state", "failed"))
        .order("desc")
        .take(10),
      workflowFailures: await ctx.db.query("failures").order("desc").take(10),
    };
  },
});
