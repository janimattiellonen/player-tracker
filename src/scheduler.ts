import "dotenv/config";
import { watch } from "node:fs";
import cron from "node-cron";
import { trackPlayers, TRACKED_PLAYERS_FILE } from "./track-players.js";
import { notifyNewResults } from "./notify.js";

// Cron schedule presets
const SCHEDULES = {
  "every-minute": "* * * * *",
  "every-5-minutes": "*/5 * * * *",
  "every-15-minutes": "*/15 * * * *",
  "every-30-minutes": "*/30 * * * *",
  "every-hour": "0 * * * *",
  "every-6-hours": "0 */6 * * *",
  "every-12-hours": "0 */12 * * *",
  daily: "0 8 * * *", // 8:00 AM
  "daily-morning": "0 8 * * *", // 8:00 AM
  "daily-evening": "0 20 * * *", // 8:00 PM
} as const;

type SchedulePreset = keyof typeof SCHEDULES;

function getSchedule(): string {
  const scheduleEnv = process.env.TRACK_SCHEDULE || "daily";

  // Check if it's a preset
  if (scheduleEnv in SCHEDULES) {
    return SCHEDULES[scheduleEnv as SchedulePreset];
  }

  // Otherwise, treat it as a custom cron expression
  if (cron.validate(scheduleEnv)) {
    return scheduleEnv;
  }

  console.error(`Invalid schedule: "${scheduleEnv}"`);
  console.error("Use a preset or a valid cron expression.");
  console.error("\nAvailable presets:");
  Object.entries(SCHEDULES).forEach(([name, expr]) => {
    console.error(`  ${name}: ${expr}`);
  });
  process.exit(1);
}

function getPlacementFilter(): string {
  return process.env.TRACK_PLACEMENT || "1-3";
}

function isNotifyEnabled(): boolean {
  return process.env.NOTIFY_ENABLED !== "false";
}

function isFileWatchEnabled(): boolean {
  return process.env.TRACK_FILE_WATCH !== "false";
}

let isRunning = false;
let pendingRerun = false;

async function safeRunTracking(trigger: string): Promise<void> {
  if (isRunning) {
    console.log(
      `[${new Date().toISOString()}] Sync already in progress (trigger: ${trigger}), queuing re-run.`
    );
    pendingRerun = true;
    return;
  }

  isRunning = true;
  try {
    await runTracking();
  } finally {
    isRunning = false;
  }

  if (pendingRerun) {
    pendingRerun = false;
    console.log(`[${new Date().toISOString()}] Running queued re-sync...`);
    await safeRunTracking("queued");
  }
}

function startFileWatcher(): void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const DEBOUNCE_MS = 1000;

  try {
    const watcher = watch(TRACKED_PLAYERS_FILE, (eventType) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        console.log(
          `\n[${new Date().toISOString()}] Detected change to tracked_players.txt (${eventType})`
        );
        safeRunTracking("file-change");
      }, DEBOUNCE_MS);
    });

    watcher.on("error", (error) => {
      console.error("File watcher error:", error.message);
    });

    process.on("SIGINT", () => {
      watcher.close();
    });

    console.log(`Watching: ${TRACKED_PLAYERS_FILE}`);
  } catch (error) {
    console.error("Could not start file watcher:", error instanceof Error ? error.message : error);
    console.error("File changes will not trigger automatic syncs.");
  }
}

async function runTracking(): Promise<void> {
  const placement = getPlacementFilter();
  const notifyEnabled = isNotifyEnabled();

  console.log(`\n[${new Date().toISOString()}] Running scheduled sync...`);

  try {
    const report = await trackPlayers(placement);
    console.log(
      `Completed: ${report.summary.playersProcessed} players, ${report.summary.totalNewResults} new results`
    );

    if (report.summary.totalNewResults > 0) {
      console.log("\nNew results found:");
      report.results.forEach((result) => {
        result.newResults.forEach((r) => {
          console.log(`  - ${r.pdga_number}: ${r.place} place at ${r.tournament_name}`);
        });
      });

      // Send notifications if enabled
      if (notifyEnabled) {
        console.log("\nSending notifications...");
        const notifyResult = await notifyNewResults();
        if (notifyResult.success) {
          console.log(`Notified about ${notifyResult.resultsNotified} result(s)`);
        } else {
          console.error(`Notification failed: ${notifyResult.error}`);
        }
      }
    }
  } catch (error) {
    console.error("Tracking failed:", error instanceof Error ? error.message : error);
  }
}

async function main(): Promise<void> {
  const schedule = getSchedule();
  const placement = getPlacementFilter();
  const notifyEnabled = isNotifyEnabled();

  const fileWatchEnabled = isFileWatchEnabled();

  console.log("=== Player Tracker Scheduler ===\n");
  console.log(`Schedule: ${schedule}`);
  console.log(`Placement filter: ${placement}`);
  console.log(`Notifications: ${notifyEnabled ? "enabled" : "disabled"}`);
  console.log(`File watching: ${fileWatchEnabled ? "enabled" : "disabled"}`);
  console.log(`\nScheduler started. Press Ctrl+C to stop.\n`);

  // Run immediately on startup
  if (process.env.TRACK_RUN_ON_START !== "false") {
    console.log("Running initial sync...");
    await safeRunTracking("startup");
  }

  // Schedule recurring runs
  cron.schedule(schedule, () => {
    safeRunTracking("cron");
  });

  // Watch for file changes
  if (fileWatchEnabled) {
    startFileWatcher();
  }

  // Keep the process running
  process.on("SIGINT", () => {
    console.log("\nScheduler stopped.");
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
