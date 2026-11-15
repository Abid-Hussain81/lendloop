import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { verify } from "./lib/signatures";

const router = httpRouter();
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
function endpoint(
  path: string,
  operation: (
    ctx: ActionCtx,
    body: Record<string, unknown>,
  ) => Promise<unknown>,
) {
  router.route({
    path,
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const secret = process.env.N8N_TO_CONVEX_SECRET;
      if (!secret || secret.length < 32)
        return json({ error: "Automation is not configured." }, 503);
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > 16384)
        return json({ error: "Request too large." }, 413);
      if (
        !(await verify(
          secret,
          request.headers.get("X-LendLoop-Timestamp") ?? "",
          path,
          raw,
          request.headers.get("X-LendLoop-Signature") ?? "",
        ))
      )
        return json({ error: "Invalid signature." }, 401);
      try {
        const body = JSON.parse(raw) as Record<string, unknown>;
        if (
          !body ||
          Array.isArray(body) ||
          typeof body.requestId !== "string" ||
          !/^[a-zA-Z0-9_-]{8,100}$/.test(body.requestId)
        )
          return json({ error: "Invalid request." }, 400);
        if (
          !(await ctx.runMutation(internal.automation.consumeRequest, {
            requestId: body.requestId,
          }))
        )
          return json({ error: "Request already used." }, 409);
        return json(await operation(ctx, body));
      } catch {
        return json({ error: "Invalid request or state." }, 400);
      }
    }),
  });
}
endpoint("/automation/overdue", async (ctx) => ({
  loans: await ctx.runQuery(internal.automation.overdue, {}),
}));
endpoint("/automation/notify", async (ctx, body) =>
  ctx.runMutation(internal.automation.notification, {
    eventId: body.eventId as Id<"events">,
  }),
);
endpoint("/automation/remind", async (ctx, body) =>
  ctx.runMutation(internal.automation.reminder, {
    loanId: body.loanId as Id<"loans">,
    day: body.day as string,
  }),
);
endpoint("/automation/failure", async (ctx, body) =>
  ctx.runMutation(internal.automation.failure, {
    key: body.key as string,
    workflow: body.workflow as string,
  }),
);
export default router;
