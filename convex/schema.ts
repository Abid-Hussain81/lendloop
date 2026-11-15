import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const category = v.union(
  v.literal("power tools"),
  v.literal("garden"),
  v.literal("kitchen"),
  v.literal("camping"),
  v.literal("other"),
);
export const condition = v.union(
  v.literal("like new"),
  v.literal("good"),
  v.literal("well used"),
);
export const loanStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("declined"),
  v.literal("returned"),
);

export default defineSchema({
  users: defineTable({ subject: v.string(), trusted: v.boolean() }).index(
    "by_subject",
    ["subject"],
  ),
  tools: defineTable({
    owner: v.string(),
    name: v.string(),
    category,
    condition,
    description: v.string(),
    archived: v.boolean(),
  })
    .index("by_owner", ["owner"])
    .index("by_archived", ["archived"]),
  loans: defineTable({
    toolId: v.id("tools"),
    lender: v.string(),
    borrower: v.string(),
    start: v.string(),
    end: v.string(),
    status: loanStatus,
    updatedAt: v.number(),
  })
    .index("by_borrower", ["borrower"])
    .index("by_lender", ["lender"])
    .index("by_tool", ["toolId"])
    .index("by_status", ["status"]),
  events: defineTable({
    loanId: v.id("loans"),
    recipient: v.string(),
    kind: v.string(),
    state: v.union(
      v.literal("pending"),
      v.literal("delivered"),
      v.literal("failed"),
    ),
    attempts: v.number(),
    nextAttempt: v.number(),
    failure: v.optional(v.string()),
  })
    .index("by_state_due", ["state", "nextAttempt"])
    .index("by_loan", ["loanId"]),
  activity: defineTable({
    loanId: v.id("loans"),
    key: v.string(),
    kind: v.string(),
    at: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_loan", ["loanId"]),
  failures: defineTable({
    key: v.string(),
    workflow: v.string(),
    at: v.number(),
  }).index("by_key", ["key"]),
  integrationRequests: defineTable({ key: v.string(), expiresAt: v.number() })
    .index("by_key", ["key"])
    .index("by_expiry", ["expiresAt"]),
});
