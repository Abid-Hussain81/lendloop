import { mkdir, readFile, writeFile } from "node:fs/promises";
const root = new URL("./", import.meta.url);
const verify = await readFile(
  new URL("scripts/verify-webhook.js", root),
  "utf8",
);
const signing = await readFile(
  new URL("scripts/sign-request.js", root),
  "utf8",
);
const code = (name, jsCode, x) => ({
  id: name.replaceAll(" ", ""),
  name,
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [x, 0],
  parameters: { mode: "runOnceForAllItems", jsCode },
});
const sign = (operation, x) =>
  code(
    `Sign ${operation} request`,
    `const operation = ${JSON.stringify(operation)};\n${signing}`,
    x,
  );
const http = (name, x) => ({
  id: name.replaceAll(" ", ""),
  name,
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position: [x, 0],
  retryOnFail: true,
  maxTries: 3,
  waitBetweenTries: 1500,
  parameters: {
    method: "POST",
    url: "={{ $json.url }}",
    sendHeaders: true,
    specifyHeaders: "json",
    jsonHeaders: "={{ JSON.stringify($json.headers) }}",
    sendBody: true,
    contentType: "raw",
    rawContentType: "application/json",
    body: "={{ $json.body }}",
    options: { timeout: 15000 },
  },
});
function workflow(id, name, nodes, errorWorkflow = "LendLoopErrors") {
  const connections = {};
  for (let i = 0; i < nodes.length - 1; i++)
    connections[nodes[i].name] = {
      main: [[{ node: nodes[i + 1].name, type: "main", index: 0 }]],
    };
  return {
    id,
    name,
    active: false,
    nodes,
    connections,
    settings: {
      executionOrder: "v1",
      timezone: "UTC",
      saveDataSuccessExecution: "none",
      saveDataErrorExecution: "all",
      ...(errorWorkflow ? { errorWorkflow } : {}),
    },
    pinData: {},
    tags: [],
  };
}
const notification = workflow(
  "LendLoopNotify",
  "LendLoop request notifications",
  [
    {
      id: "IncomingEvent",
      name: "Incoming signed event",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2.1,
      position: [0, 0],
      webhookId: "lendloop-request",
      parameters: {
        httpMethod: "POST",
        path: "lendloop-request",
        responseMode: "responseNode",
        options: { rawBody: true },
      },
    },
    code("Verify webhook signature", verify, 240),
    sign("notify", 480),
    http("Record mock notification", 720),
    {
      id: "AcknowledgeEvent",
      name: "Acknowledge event",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.4,
      position: [960, 0],
      parameters: {
        respondWith: "json",
        responseBody: '={"acknowledged":true}',
        options: { responseCode: 200 },
      },
    },
  ],
);
const overdue = workflow("LendLoopOverdue", "LendLoop overdue reminders", [
  {
    id: "DailySchedule",
    name: "Daily at 09 UTC",
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1.2,
    position: [0, 0],
    parameters: {
      rule: {
        interval: [{ field: "cronExpression", expression: "0 9 * * *" }],
      },
    },
  },
  sign("overdue", 240),
  http("Fetch overdue loans", 480),
  code(
    "One item per overdue loan",
    "return ($input.first().json.loans || []).map(loan => ({ json: { loanId: loan.loanId, day: loan.day } }));",
    720,
  ),
  sign("remind", 960),
  http("Record mock reminder", 1200),
]);
const errors = workflow(
  "LendLoopErrors",
  "LendLoop automation errors",
  [
    {
      id: "FailedExecution",
      name: "Workflow failure",
      type: "n8n-nodes-base.errorTrigger",
      typeVersion: 1,
      position: [0, 0],
      parameters: {},
    },
    sign("failure", 240),
    http("Record sanitized failure", 480),
  ],
  null,
);
await mkdir(new URL("workflows/", root), { recursive: true });
for (const [file, value] of Object.entries({
  "notifications.json": notification,
  "overdue.json": overdue,
  "errors.json": errors,
}))
  await writeFile(
    new URL(`workflows/${file}`, root),
    JSON.stringify(value, null, 2) + "\n",
  );
console.log(
  "Generated three n8n workflow exports. Runtime secrets are referenced by environment variable only.",
);
