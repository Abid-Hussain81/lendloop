import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const secret = "test-only-workflow-secret-123456789012345";
const scripts = new URL("../automation/scripts/", import.meta.url);
function run(
  name: string,
  items: unknown[],
  extra: Record<string, unknown> = {},
  prefix = "",
) {
  const code = readFileSync(new URL(name, scripts), "utf8");
  const config = JSON.parse(
    readFileSync(
      new URL("../automation/runner-config.json", import.meta.url),
      "utf8",
    ),
  );
  const allowed =
    config["task-runners"][0][
      "env-overrides"
    ].NODE_FUNCTION_ALLOW_BUILTIN.split(",");
  const nodeRequire = createRequire(import.meta.url);
  const sandbox = {
    require: (name: string) => {
      if (!allowed.includes(name))
        throw new Error(`Module not allowlisted: ${name}`);
      return nodeRequire(name);
    },
    Buffer,
    Date,
    console,
    $input: { first: () => items[0], all: () => items },
    $env: {
      CONVEX_TO_N8N_SECRET: secret,
      N8N_TO_CONVEX_SECRET: secret,
      CONVEX_SITE_URL: "https://example.convex.site",
      N8N_WEBHOOK_PATH: "/webhook/lendloop-request",
    },
    ...extra,
  };
  return runInNewContext(
    `(async function() { ${prefix}\n${code}\n }).call(context)`,
    {
      ...sandbox,
      context: {
        helpers: {
          getBinaryDataBuffer: async () =>
            (items[0] as { bytes: Buffer }).bytes,
        },
      },
    },
  );
}
describe("actual n8n Code node programs", () => {
  it("verifies raw webhook bytes before passing the event ID forward", async () => {
    const body = '{ "eventId": "event-1", "kind": "request.created" }';
    const timestamp = `${Math.floor(Date.now() / 1000)}`;
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}./webhook/lendloop-request.${body}`)
      .digest("hex");
    const input = {
      bytes: Buffer.from(body),
      binary: { data: {} },
      json: {
        headers: {
          "x-lendloop-timestamp": timestamp,
          "x-lendloop-signature": signature,
        },
      },
    };
    const result = await run("verify-webhook.js", [input]);
    expect(JSON.parse(JSON.stringify(result))).toEqual([
      { json: { eventId: "event-1" } },
    ]);
    await expect(
      run("verify-webhook.js", [{ ...input, bytes: Buffer.from(body + " ") }]),
    ).rejects.toThrow();
  });
  it("signs each write-back and regenerates a nonce on a new attempt", async () => {
    const result = await run(
      "sign-request.js",
      [{ json: { loanId: "loan-1", day: "2026-12-04" } }],
      {},
      'const operation = "remind";',
    );
    expect(result).toHaveLength(1);
    const first = result[0].json;
    expect(first.url).toBe("https://example.convex.site/automation/remind");
    expect(JSON.parse(first.body)).toMatchObject({
      loanId: "loan-1",
      day: "2026-12-04",
    });
    const expected = createHmac("sha256", secret)
      .update(
        `${first.headers["X-LendLoop-Timestamp"]}./automation/remind.${first.body}`,
      )
      .digest("hex");
    expect(first.headers["X-LendLoop-Signature"]).toBe(expected);
    const retry = await run(
      "sign-request.js",
      [{ json: { loanId: "loan-1", day: "2026-12-04" } }],
      {},
      'const operation = "remind";',
    );
    expect(JSON.parse(retry[0].json.body).requestId).not.toBe(
      JSON.parse(first.body).requestId,
    );
  });
  it("does not serialize an upstream error body or secrets in failure reports", async () => {
    const result = await run(
      "sign-request.js",
      [
        {
          json: {
            execution: { id: "123", error: { message: "sensitive-value" } },
            workflow: { name: "LendLoop overdue reminders" },
          },
        },
      ],
      {},
      'const operation = "failure";',
    );
    expect(result).toHaveLength(1);
    const body = JSON.parse(result[0].json.body);
    expect(body).toMatchObject({ key: "123", workflow: "overdue" });
    expect(JSON.stringify(result)).not.toContain("sensitive-value");
    expect(JSON.stringify(result)).not.toContain(secret);
  });
});
