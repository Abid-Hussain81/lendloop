import { createHmac } from "node:crypto";
import { convexTest } from "convex-test";
import { beforeEach, expect, it, vi } from "vitest";
import schema from "../convex/schema";
const modules = import.meta.glob("../convex/**/*.ts");
const secret = "test-only-inbound-secret-123456789012345";
beforeEach(() => {
  vi.stubEnv("N8N_TO_CONVEX_SECRET", secret);
});
function request(
  path: string,
  body: string,
  timestamp = `${Math.floor(Date.now() / 1000)}`,
) {
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${path}.${body}`)
    .digest("hex");
  return {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      "X-LendLoop-Timestamp": timestamp,
      "X-LendLoop-Signature": signature,
    },
  };
}
it("authenticates before returning overdue data and rejects replayed request IDs", async () => {
  const t = convexTest(schema, modules);
  const path = "/automation/overdue";
  const body = '{"requestId":"http-request-01"}';
  expect((await t.fetch(path, { method: "POST", body })).status).toBe(401);
  const first = await t.fetch(path, request(path, body));
  expect(first.status).toBe(200);
  expect(await first.json()).toEqual({ loans: [] });
  expect((await t.fetch(path, request(path, body))).status).toBe(409);
});
it("rejects tampered payloads and stale signatures", async () => {
  const t = convexTest(schema, modules);
  const path = "/automation/overdue";
  const body = '{"requestId":"http-request-02"}';
  const signed = request(path, body);
  expect((await t.fetch(path, { ...signed, body: body + " " })).status).toBe(
    401,
  );
  expect(
    (
      await t.fetch(
        path,
        request(path, body, `${Math.floor(Date.now() / 1000) - 301}`),
      )
    ).status,
  ).toBe(401);
});
