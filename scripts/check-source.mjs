import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const secrets = [".env.local", "automation/.env"].flatMap((file) =>
  existsSync(file)
    ? Object.entries(parseEnv(readFileSync(file, "utf8")))
        .filter(
          ([key, value]) =>
            /SECRET|TOKEN|ENCRYPTION_KEY/.test(key) && value.length >= 24,
        )
        .map(([, value]) => value)
    : [],
);
for (const file of files) {
  if (
    /^(\.env\.local$|automation\/\.env$|\.setup\/|\.convex\/|node_modules\/)/.test(
      file,
    )
  )
    throw new Error("Runtime state was accidentally tracked.");
  const source = readFileSync(file, "utf8");
  if (secrets.some((secret) => source.includes(secret)))
    throw new Error(
      `A runtime secret appears in ${file}; remove it before publication.`,
    );
}
const workflows = ["errors", "notifications", "overdue"].map((name) =>
  JSON.parse(readFileSync(`automation/workflows/${name}.json`, "utf8")),
);
const ids = new Set(workflows.map((workflow) => workflow.id));
for (const workflow of workflows) {
  if (workflow.active !== false)
    throw new Error("Exports must be inactive until configured.");
  const names = new Set(workflow.nodes.map((node) => node.name));
  if (names.size !== workflow.nodes.length)
    throw new Error("Duplicate workflow node names.");
  if (
    workflow.settings.errorWorkflow &&
    !ids.has(workflow.settings.errorWorkflow)
  )
    throw new Error("Unknown error workflow.");
  for (const [from, connections] of Object.entries(workflow.connections)) {
    if (!names.has(from)) throw new Error("Unknown workflow source.");
    for (const connection of Object.values(connections).flat(2))
      if (!names.has(connection.node))
        throw new Error("Unknown workflow target.");
  }
  for (const node of workflow.nodes)
    if (node.credentials)
      throw new Error(
        "Credential bindings must be configured locally, not committed.",
      );
}
console.log(
  `Checked ${files.length} tracked files for runtime-secret leaks and validated all three workflow graphs.`,
);
