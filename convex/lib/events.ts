import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
export async function enqueue(
  ctx: MutationCtx,
  loanId: Id<"loans">,
  recipient: string,
  kind: string,
) {
  await ctx.db.insert("events", {
    loanId,
    recipient,
    kind,
    state: "pending",
    attempts: 0,
    nextAttempt: Date.now(),
  });
}
