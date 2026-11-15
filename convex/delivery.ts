import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { sign } from "./lib/signatures";

export const dispatch = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const target = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.CONVEX_TO_N8N_SECRET;
    if (!target || !secret || secret.length < 32) return;
    const url = new URL(target);
    const events = await ctx.runMutation(internal.automation.claimBatch, {});
    await Promise.all(
      events.map(async (event) => {
        try {
          const body = JSON.stringify({ eventId: event._id, kind: event.kind });
          const timestamp = `${Math.floor(Date.now() / 1000)}`;
          const signature = await sign(secret, timestamp, url.pathname, body);
          const response = await fetch(url, {
            method: "POST",
            redirect: "error",
            body,
            headers: {
              "Content-Type": "application/json",
              "X-LendLoop-Timestamp": timestamp,
              "X-LendLoop-Signature": signature,
            },
            signal: AbortSignal.timeout(20_000),
          });
          if (!response.ok || (await response.json()).acknowledged !== true)
            throw new Error("Unacknowledged delivery");
          // The signed n8n callback commits the delivery/activity. An HTTP response
          // alone is not the source of truth for persistent notification state.
        } catch {
          await ctx.runMutation(internal.automation.failedAttempt, {
            id: event._id,
          });
        }
      }),
    );
  },
});
