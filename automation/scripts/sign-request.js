// n8n Code node; the generator prepends a constant `operation`.
const crypto = require("crypto");
const { URL } = require("url");
const secret = $env.N8N_TO_CONVEX_SECRET;
if (!secret || secret.length < 32) throw new Error("Integration signing is not configured");
if (!["overdue", "notify", "remind", "failure"].includes(operation)) throw new Error("Unknown operation");
const base = new URL($env.CONVEX_SITE_URL);
if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1", "host.docker.internal"].includes(base.hostname))) throw new Error("Use HTTPS outside local development");
const path = `/automation/${operation}`;
return $input.all().map(item => {
  const input = item.json;
  let payload = {};
  if (operation === "notify") payload = { eventId: input.eventId };
  if (operation === "remind") payload = { loanId: input.loanId, day: input.day };
  if (operation === "failure") {
    const candidate = String(input.execution?.id || input.trigger?.executionId || "");
    const key = /^[a-zA-Z0-9_-]{1,100}$/.test(candidate) ? candidate : crypto.randomUUID();
    const name = String(input.workflow?.name || "").toLowerCase();
    payload = { key, workflow: name.includes("overdue") ? "overdue" : name.includes("notification") ? "notification" : "unknown" };
  }
  const body = JSON.stringify({ requestId: crypto.randomUUID(), ...payload });
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${path}.${body}`).digest("hex");
  return { json: { url: `${base.origin}${path}`, body, headers: {
    "Content-Type": "application/json", "X-LendLoop-Timestamp": timestamp, "X-LendLoop-Signature": signature,
  } } };
});
