const encoder = new TextEncoder();
async function key(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function sign(
  secret: string,
  timestamp: string,
  path: string,
  body: string,
): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await key(secret),
    encoder.encode(`${timestamp}.${path}.${body}`),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
export async function verify(
  secret: string,
  timestamp: string,
  path: string,
  body: string,
  signature: string,
  now = Date.now(),
): Promise<boolean> {
  if (
    !secret ||
    !/^\d{10}$/.test(timestamp) ||
    !/^[a-f0-9]{64}$/.test(signature) ||
    Math.abs(now - Number(timestamp) * 1000) > 300_000
  )
    return false;
  const bytes = Uint8Array.from(signature.match(/.{2}/g)!, (value) =>
    parseInt(value, 16),
  );
  return crypto.subtle.verify(
    "HMAC",
    await key(secret),
    bytes,
    encoder.encode(`${timestamp}.${path}.${body}`),
  );
}
