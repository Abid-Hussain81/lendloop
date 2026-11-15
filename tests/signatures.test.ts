import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sign, verify } from "../convex/lib/signatures";

const secret = "test-only-signing-key-not-for-real-use-123";
const timestamp = "1794744000";
const now = Number(timestamp) * 1000;
const path = "/automation/notify";
const body = '{"requestId":"test-request-01","eventId":"example"}';
describe("webhook signatures", () => {
  it("matches Node HMAC and accepts untampered signed bytes", async () => {
    const expected = createHmac("sha256", secret)
      .update(`${timestamp}.${path}.${body}`)
      .digest("hex");
    expect(await sign(secret, timestamp, path, body)).toBe(expected);
    expect(await verify(secret, timestamp, path, body, expected, now)).toBe(
      true,
    );
  });
  it("rejects body/path tampering, malformed signatures and timestamps", async () => {
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${path}.${body}`)
      .digest("hex");
    expect(
      await verify(secret, timestamp, path, body + " ", signature, now),
    ).toBe(false);
    expect(
      await verify(
        secret,
        timestamp,
        "/automation/remind",
        body,
        signature,
        now,
      ),
    ).toBe(false);
    expect(await verify(secret, timestamp, path, body, "bad", now)).toBe(false);
    expect(
      await verify(secret, "not-a-number", path, body, signature, now),
    ).toBe(false);
  });
  it("rejects stale and far-future requests", async () => {
    const signature = await sign(secret, timestamp, path, body);
    expect(
      await verify(secret, timestamp, path, body, signature, now + 301_000),
    ).toBe(false);
    expect(
      await verify(secret, timestamp, path, body, signature, now - 301_000),
    ).toBe(false);
  });
});
