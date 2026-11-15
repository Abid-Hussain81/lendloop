import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.interval(
  "Dispatch notification outbox",
  { minutes: 1 },
  internal.delivery.dispatch,
  {},
);
crons.interval(
  "Expire integration replay keys",
  { minutes: 10 },
  internal.automation.cleanup,
  {},
);
export default crons;
