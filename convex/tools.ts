import { query, mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { category, condition } from "./schema";
import { identity } from "./lib/auth";
import { today } from "./lib/dates";

const fields = {
  name: v.string(),
  category,
  condition,
  description: v.string(),
};
function clean(fields: { name: string; description: string }) {
  const name = fields.name.trim();
  const description = fields.description.trim();
  if (!name || name.length > 100 || !description || description.length > 1000)
    throw new ConvexError(
      "Use a tool name of 1–100 characters and description of 1–1000 characters.",
    );
  return { name, description };
}
async function reservations(ctx: QueryCtx, tool: Doc<"tools">) {
  return (
    await ctx.db
      .query("loans")
      .withIndex("by_tool", (q) => q.eq("toolId", tool._id))
      .collect()
  ).filter((loan) => loan.status === "approved");
}
export const publicList = query({
  args: {},
  handler: async (ctx) => {
    const tools = await ctx.db
      .query("tools")
      .withIndex("by_archived", (q) => q.eq("archived", false))
      .take(100);
    const available = await Promise.all(
      tools.map(async (tool) => ({
        tool,
        blocked: (await reservations(ctx, tool)).some(
          (loan) => loan.start <= today(),
        ),
      })),
    );
    return available
      .filter((item) => !item.blocked)
      .map(({ tool }) => ({ name: tool.name, category: tool.category }));
  },
});
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await identity(ctx);
    const tools = await ctx.db
      .query("tools")
      .withIndex("by_archived", (q) => q.eq("archived", false))
      .take(100);
    return Promise.all(
      tools.map(async (tool) => {
        const bookings = await reservations(ctx, tool);
        const profile = await ctx.db
          .query("users")
          .withIndex("by_subject", (q) => q.eq("subject", tool.owner))
          .unique();
        return {
          ...tool,
          owned: tool.owner === user.subject,
          trusted: profile?.trusted ?? false,
          available: !bookings.some((loan) => loan.start <= today()),
          reservations: bookings.map((loan) => ({
            start: loan.start,
            end: loan.end,
          })),
        };
      }),
    );
  },
});
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await identity(ctx);
    return (
      await ctx.db
        .query("tools")
        .withIndex("by_owner", (q) => q.eq("owner", user.subject))
        .collect()
    ).filter((tool) => !tool.archived);
  },
});
export const create = mutation({
  args: fields,
  handler: async (ctx, args) => {
    const user = await identity(ctx);
    return ctx.db.insert("tools", {
      ...args,
      ...clean(args),
      owner: user.subject,
      archived: false,
    });
  },
});
export const update = mutation({
  args: { id: v.id("tools"), ...fields },
  handler: async (ctx, { id, ...fields }) => {
    const user = await identity(ctx);
    const tool = await ctx.db.get(id);
    if (!tool || tool.owner !== user.subject || tool.archived)
      throw new ConvexError("This listing cannot be edited.");
    await ctx.db.patch(id, { ...fields, ...clean(fields) });
  },
});
export const remove = mutation({
  args: { id: v.id("tools") },
  handler: async (ctx, { id }) => {
    const user = await identity(ctx);
    const tool = await ctx.db.get(id);
    if (!tool || (tool.owner !== user.subject && user.role !== "admin"))
      throw new ConvexError("This listing cannot be removed.");
    await ctx.db.patch(id, { archived: true });
  },
});
