// n8n Code node: Run Once for All Items. Never reconstruct parsed JSON here.
const crypto = require("crypto");
const item = $input.first();
const secret = $env.CONVEX_TO_N8N_SECRET;
if (!secret || secret.length < 32 || !item.binary?.data) throw new Error("Webhook configuration or raw body missing");
const raw = (await this.helpers.getBinaryDataBuffer(0, "data")).toString("utf8");
if (Buffer.byteLength(raw, "utf8") > 16384) throw new Error("Webhook body too large");
const timestamp = item.json.headers["x-lendloop-timestamp"] ?? "";
const signature = item.json.headers["x-lendloop-signature"] ?? "";
if (!/^\d{10}$/.test(timestamp) || !/^[a-f0-9]{64}$/.test(signature) || Math.abs(Date.now() - Number(timestamp) * 1000) > 300000) throw new Error("Webhook authentication failed");
const path = $env.N8N_WEBHOOK_PATH || "/webhook/lendloop-request";
const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${path}.${raw}`).digest();
if (!crypto.timingSafeEqual(expected, Buffer.from(signature, "hex"))) throw new Error("Webhook authentication failed");
const payload = JSON.parse(raw);
if (typeof payload.eventId !== "string" || payload.eventId.length > 100 || !payload.eventId) throw new Error("Invalid event");
return [{ json: { eventId: payload.eventId } }];
