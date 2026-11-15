import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
beforeEach(() => vi.setSystemTime(new Date("2026-11-15T12:00:00Z")));
async function fixture() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "lender" });
  const borrower = t.withIdentity({ subject: "borrower" });
  const toolId = await owner.mutation(api.tools.create, {
    name: "Spade",
    category: "garden",
    condition: "good",
    description: "Garden spade",
  });
  const loanId = await borrower.mutation(api.loans.request, {
    toolId,
    start: "2026-12-01",
    end: "2026-12-03",
  });
  return { t, owner, borrower, loanId };
}
describe("automation persistence", () => {
  it("writes request and status-change events transactionally", async () => {
    const { t, owner, loanId } = await fixture();
    expect(
      await t.run((ctx) => ctx.db.query("events").collect()),
    ).toMatchObject([
      {
        loanId,
        recipient: "lender",
        kind: "request.created",
        state: "pending",
      },
    ]);
    await owner.mutation(api.loans.decide, { id: loanId, approve: true });
    expect(
      (await t.run((ctx) => ctx.db.query("events").collect())).map(
        (event) => event.kind,
      ),
    ).toEqual(["request.created", "request.approved"]);
  });
  it("records a mock notification once even when delivery is retried", async () => {
    const { t, loanId } = await fixture();
    const event = (await t.run((ctx) => ctx.db.query("events").collect()))[0];
    expect(
      await t.mutation(internal.automation.notification, {
        eventId: event._id,
      }),
    ).toMatchObject({ duplicate: false });
    expect(
      await t.mutation(internal.automation.notification, {
        eventId: event._id,
      }),
    ).toMatchObject({ duplicate: true });
    expect(
      await t.run((ctx) => ctx.db.query("activity").collect()),
    ).toMatchObject([{ loanId, kind: "Mock request notification recorded" }]);
  });
  it("only reminds overdue approved loans and deduplicates a loan/day", async () => {
    const { t, owner, loanId } = await fixture();
    await owner.mutation(api.loans.decide, { id: loanId, approve: true });
    expect(await t.query(internal.automation.overdue, {})).toEqual([]);
    vi.setSystemTime(new Date("2026-12-04T12:00:00Z"));
    expect(await t.query(internal.automation.overdue, {})).toMatchObject([
      { loanId, day: "2026-12-04" },
    ]);
    expect(
      await t.mutation(internal.automation.reminder, {
        loanId,
        day: "2026-12-04",
      }),
    ).toMatchObject({ duplicate: false });
    expect(
      await t.mutation(internal.automation.reminder, {
        loanId,
        day: "2026-12-04",
      }),
    ).toMatchObject({ duplicate: true });
    expect(await t.query(internal.automation.overdue, {})).toEqual([]);
    await expect(
      t.mutation(internal.automation.reminder, { loanId, day: "2026-12-05" }),
    ).rejects.toThrow();
  });
  it("rejects a replayed integration request ID", async () => {
    const { t } = await fixture();
    expect(
      await t.mutation(internal.automation.consumeRequest, {
        requestId: "unique-request-01",
      }),
    ).toBe(true);
    expect(
      await t.mutation(internal.automation.consumeRequest, {
        requestId: "unique-request-01",
      }),
    ).toBe(false);
  });
  it("leases due deliveries and stops after five unsuccessful attempts", async () => {
    const { t } = await fixture();
    let now = Date.now();
    for (let attempt = 1; attempt <= 5; attempt++) {
      const batch = await t.mutation(internal.automation.claimBatch, {});
      expect(batch).toHaveLength(1);
      expect(batch[0].attempts).toBe(attempt);
      expect(await t.mutation(internal.automation.claimBatch, {})).toEqual([]);
      await t.mutation(internal.automation.failedAttempt, { id: batch[0]._id });
      now += 3_600_000;
      vi.setSystemTime(now);
    }
    expect(await t.mutation(internal.automation.claimBatch, {})).toEqual([]);
    expect(
      await t.run((ctx) => ctx.db.query("events").collect()),
    ).toMatchObject([
      { state: "failed", attempts: 5, failure: "delivery_failed" },
    ]);
  });
  it("denies normal users access to automation failure details", async () => {
    const { borrower } = await fixture();
    await expect(borrower.query(api.automation.health, {})).rejects.toThrow();
  });
});
