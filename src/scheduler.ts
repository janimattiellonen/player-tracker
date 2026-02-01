import cron from "node-cron";
import { trackPlayers } from "./track-players.js";

// Cron schedule presets
const SCHEDULES = {
  "every-minute": "* * * * *",
  "every-5-minutes": "*/5 * * * *",
  "every-15-minutes": "*/15 * * * *",
  "every-30-minutes": "*/30 * * * *",
  "every-hour": "0 * * * *",
  "every-6-hours": "0 */6 * * *",
  "every-12-hours": "0 */12 * * *",
  "daily": "0 8 * * *", // 8:00 AM
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

async function runTracking(): Promise<void> {
  const placement = getPlacementFilter();
  console.log(`\n[${new Date().toISOString()}] Running scheduled sync...`);

  try {
    const report = await trackPlayers(placement);
    console.log(`Completed: ${report.summary.playersProcessed} players, ${report.summary.totalNewResults} new results`);

    if (report.summary.totalNewResults > 0) {
      console.log("\nNew results found:");
      report.results.forEach((result) => {
        result.newResults.forEach((r) => {
          console.log(`  - ${r.pdga_number}: ${r.place} place at ${r.tournament_name}`);
        });
      });
    }
  } catch (error) {
    console.error("Tracking failed:", error instanceof Error ? error.message : error);
  }
}

async function main(): Promise<void> {
  const schedule = getSchedule();
  const placement = getPlacementFilter();

  console.log("=== Player Tracker Scheduler ===\n");
  console.log(`Schedule: ${schedule}`);
  console.log(`Placement filter: ${placement}`);
  console.log(`\nScheduler started. Press Ctrl+C to stop.\n`);

  // Run immediately on startup
  if (process.env.TRACK_RUN_ON_START !== "false") {
    console.log("Running initial sync...");
    await runTracking();
  }

  // Schedule recurring runs
  cron.schedule(schedule, () => {
    runTracking();
  });

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
