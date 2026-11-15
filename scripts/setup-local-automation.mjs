import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
const env =
  [
    `N8N_ENCRYPTION_KEY=${randomBytes(32).toString("hex")}`,
    `N8N_RUNNERS_AUTH_TOKEN=${randomBytes(32).toString("hex")}`,
    `CONVEX_TO_N8N_SECRET=${randomBytes(32).toString("hex")}`,
    `N8N_TO_CONVEX_SECRET=${randomBytes(32).toString("hex")}`,
    "CONVEX_SITE_URL=http://host.docker.internal:3211",
    "N8N_WEBHOOK_PATH=/webhook/lendloop-request",
    "WEBHOOK_URL=http://localhost:5678/",
  ].join("\n") + "\n";
try {
  await writeFile(new URL("../automation/.env", import.meta.url), env, {
    flag: "wx",
    mode: 0o600,
  });
  console.log(
    "Created ignored automation/.env with independent local secrets. Values were not printed.",
  );
} catch (error) {
  if (error.code === "EEXIST")
    console.log("automation/.env already exists; left unchanged.");
  else throw error;
}
