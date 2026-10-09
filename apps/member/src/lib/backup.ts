import { api } from "./api";
import { getAllTemplates, getAllWorkouts, getPRs } from "./workouts";

const WEIGHTS_KEY = "restfit_weights";
const SCHEMA_VERSION = 1;

// Fire-and-forget: never block the UI, never throw. Debounced so a burst
// of edits produces one request.
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;

function readWeights(): unknown[] {
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function pushNow() {
  if (inFlight) {
    // Schedule a follow-up push after the current one completes so we
    // don't drop updates that happened during the request.
    pendingTimer = setTimeout(pushNow, 500);
    return;
  }
  inFlight = true;
  try {
    await api.post("/app/workouts/backup", {
      workouts: getAllWorkouts(),
      weights: readWeights(),
      prs: getPRs(),
      templates: getAllTemplates(),
      schemaVersion: SCHEMA_VERSION,
      backedUpAt: new Date().toISOString(),
    });
  } catch {
    // Silent. The next workout will retry. Backups should never break
    // the app — that's the entire point of them being silent.
  } finally {
    inFlight = false;
  }
}

/** Debounced backup. Call after any local write that changes workout data. */
export function scheduleBackup() {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(pushNow, 2000);
}

/** Force an immediate push (e.g. on app background). */
export function flushBackup() {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = null;
  void pushNow();
}