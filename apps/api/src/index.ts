import { app } from "./app.js";
import { env } from "./env.js";
import { startJobs } from "./jobs/reminders.js";
import { orchPayEnabled } from "./services/orchpay.js";

app.listen(env.PORT, () => {
  console.log(`RestFit API on http://localhost:${env.PORT}`);
  if (!orchPayEnabled()) console.log("Online payments off: set ORCHPAY_API_KEY to enable Orch-Pay");
  if (!env.TERMII_API_KEY) console.log("Messaging off: reminders will be printed here instead of sent");
  startJobs();
});