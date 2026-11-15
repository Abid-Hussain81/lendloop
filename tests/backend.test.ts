import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";

const modules = import.meta.glob("../convex/**/*.ts");
const sample = {
  name: "Cordless drill",
  category: "power tools" as const,
  condition: "good" as const,
  description: "Drill with a charged battery.",
};
function harness() {
  const t = convexTest(schema, modules);
  return {
    t,
    owner: t.withIdentity({ subject: "owner" }),
    borrower: t.withIdentity({ subject: "borrower" }),
    stranger: t.withIdentity({ subject: "stranger" }),
    admin: t.withIdentity({ subject: "admin" }),
  };
}
const dates = { start: "2026-12-01", end: "2026-12-03" };

beforeEach(() => {
  vi.stubEnv("ADMIN_CLERK_USER_IDS", "admin");
  vi.setSystemTime(new Date("2026-11-15T12:00:00Z"));
});

describe("tools and privacy", () => {
  it("projects only names and categories to visitors", async () => {
    const { t, owner } = harness();
    await owner.mutation(api.tools.create, sample);
    expect(await t.query(api.tools.publicList, {})).toEqual([
      { name: "Cordless drill", category: "power tools" },
    ]);
  });
  it("denies anonymous creation and authenticated access to private listings", async () => {
    const { t } = harness();
    await expect(t.mutation(api.tools.create, sample)).rejects.toThrow();
    await expect(t.query(api.tools.list, {})).rejects.toThrow();
  });
  it("only permits an owner to edit and an owner or admin to remove", async () => {
    const { owner, stranger, admin } = harness();
    const id = await owner.mutation(api.tools.create, sample);
    await expect(
      stranger.mutation(api.tools.update, { id, ...sample, name: "Stolen" }),
    ).rejects.toThrow();
    await expect(stranger.mutation(api.tools.remove, { id })).rejects.toThrow();
    await admin.mutation(api.tools.remove, { id });
    expect(await owner.query(api.tools.mine, {})).toEqual([]);
  });
  it("rejects empty tool names at the backend", async () => {
    const { owner } = harness();
    await expect(
      owner.mutation(api.tools.create, { ...sample, name: "  " }),
    ).rejects.toThrow();
  });
  it("trusted status is admin-controlled and cannot grant admin role", async () => {
    const { owner, admin, stranger } = harness();
    await owner.mutation(api.tools.create, sample);
    await expect(
      stranger.mutation(api.users.setTrusted, {
        subject: "owner",
        trusted: true,
      }),
    ).rejects.toThrow();
    await admin.mutation(api.users.setTrusted, {
      subject: "owner",
      trusted: true,
    });
    expect(await owner.query(api.users.me, {})).toMatchObject({
      role: "user",
      trusted: true,
    });
    await expect(owner.query(api.loans.all, {})).rejects.toThrow();
  });
});

describe("loan ownership and state", () => {
  it("allows the borrower to request, lender to approve, and participant to return", async () => {
    const { t, owner, borrower } = harness();
    const toolId = await owner.mutation(api.tools.create, sample);
    const id = await borrower.mutation(api.loans.request, { toolId, ...dates });
    await owner.mutation(api.loans.decide, { id, approve: true });
    await borrower.mutation(api.loans.returnLoan, { id });
    expect(await borrower.query(api.loans.mine, {})).toMatchObject([
      { status: "returned", toolName: "Cordless drill" },
    ]);
    expect((await t.run((ctx) => ctx.db.get(id)))?.status).toBe("returned");
  });
  it("denies own-tool borrowing, invalid dates, and requests for archived tools", async () => {
    const { owner, borrower } = harness();
    const toolId = await owner.mutation(api.tools.create, sample);
    await expect(
      owner.mutation(api.loans.request, { toolId, ...dates }),
    ).rejects.toThrow();
    for (const range of [
      { start: "2026-11-14", end: "2026-12-01" },
      { start: "2026-12-03", end: "2026-12-01" },
      { start: "2026-02-30", end: "2026-12-03" },
    ]) {
      await expect(
        borrower.mutation(api.loans.request, { toolId, ...range }),
      ).rejects.toThrow();
    }
    await owner.mutation(api.tools.remove, { id: toolId });
    await expect(
      borrower.mutation(api.loans.request, { toolId, ...dates }),
    ).rejects.toThrow();
  });
  it("denies borrower and outsider decisions, outsider returns, and repeated transitions", async () => {
    const { owner, borrower, stranger } = harness();
    const toolId = await owner.mutation(api.tools.create, sample);
    const id = await borrower.mutation(api.loans.request, { toolId, ...dates });
    await expect(
      borrower.mutation(api.loans.decide, { id, approve: true }),
    ).rejects.toThrow();
    await expect(
      stranger.mutation(api.loans.decide, { id, approve: true }),
    ).rejects.toThrow();
    await expect(
      borrower.mutation(api.loans.returnLoan, { id }),
    ).rejects.toThrow();
    await owner.mutation(api.loans.decide, { id, approve: true });
    await expect(
      stranger.mutation(api.loans.returnLoan, { id }),
    ).rejects.toThrow();
    await expect(
      owner.mutation(api.loans.decide, { id, approve: false }),
    ).rejects.toThrow();
  });
  it("rejects an overlapping approval including a shared end date", async () => {
    const { owner, borrower, stranger } = harness();
    const toolId = await owner.mutation(api.tools.create, sample);
    const first = await borrower.mutation(api.loans.request, {
      toolId,
      ...dates,
    });
    const second = await stranger.mutation(api.loans.request, {
      toolId,
      start: "2026-12-03",
      end: "2026-12-05",
    });
    await owner.mutation(api.loans.decide, { id: first, approve: true });
    await expect(
      owner.mutation(api.loans.decide, { id: second, approve: true }),
    ).rejects.toThrow(/reserved/i);
  });
  it("preserves existing loans when a tool is removed", async () => {
    const { owner, borrower } = harness();
    const toolId = await owner.mutation(api.tools.create, sample);
    const id = await borrower.mutation(api.loans.request, { toolId, ...dates });
    await owner.mutation(api.loans.decide, { id, approve: true });
    await owner.mutation(api.tools.remove, { id: toolId });
    expect(await borrower.query(api.loans.mine, {})).toMatchObject([
      { toolName: "Cordless drill", status: "approved" },
    ]);
    await owner.mutation(api.loans.returnLoan, { id });
  });
  it("does not reveal another user's loans or automation to an outsider", async () => {
    const { owner, borrower, stranger } = harness();
    const toolId = await owner.mutation(api.tools.create, sample);
    await borrower.mutation(api.loans.request, { toolId, ...dates });
    expect(await stranger.query(api.loans.mine, {})).toEqual([]);
    expect(await stranger.query(api.loans.incoming, {})).toEqual([]);
    await expect(stranger.query(api.loans.all, {})).rejects.toThrow();
  });
});
