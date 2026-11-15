// Development-only bootstrap using the pinned Convex SDK's own templates.
// Once a deployment is configured, use the supported `npm run codegen` instead.
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { serverCodegen } from "../node_modules/convex/dist/esm/cli/codegen_templates/server.js";
import { apiCodegen } from "../node_modules/convex/dist/esm/cli/codegen_templates/api.js";

const base = new URL("../convex/", import.meta.url);
const modules = (await readdir(base)).filter(
  (name) =>
    name.endsWith(".ts") &&
    !["schema.ts", "auth.config.ts", "http.ts", "crons.ts"].includes(name),
);
await mkdir(new URL("_generated/", base), { recursive: true });
for (const [name, content] of Object.entries({
  "server.ts": serverCodegen({ useTypeScript: true }).TS,
  "api.ts": apiCodegen(modules, { useTypeScript: true }).TS,
  "dataModel.ts": `// Offline bootstrap types; regenerate with npx convex dev after setup.
import type { DataModelFromSchemaDefinition, DocumentByName, TableNamesInDataModel } from "convex/server";
import type { GenericId } from "convex/values";
import schema from "../schema";
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export type TableNames = TableNamesInDataModel<DataModel>;
export type Doc<T extends TableNames> = DocumentByName<DataModel, T>;
export type Id<T extends TableNames> = GenericId<T>;
`,
})) {
  await writeFile(new URL(`_generated/${name}`, base), content);
}
console.log(
  "Generated typed Convex helpers from the installed SDK templates (offline).",
);
