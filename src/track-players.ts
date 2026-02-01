import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchPlayerHtml } from "./fetch-player-profile.js";
import { parsePlayerProfile, parsePlacementRange, filterResultsByPlacement } from "./parse-player-profile.js";
import { PlayerRepository, StoredResult } from "./repository.js";
import { getDb, closeDb } from "./db.js";
import type { PlacementRange } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const TRACKED_PLAYERS_FILE = join(PROJECT_ROOT, "tracked_players.txt");

interface TrackingResult {
  pdgaNumber: string;
  playerName: string | null;
  newResults: StoredResult[];
  totalResultsFound: number;
  error?: string;
}

interface TrackingReport {
  timestamp: string;
  placementFilter: PlacementRange | null;
  results: TrackingResult[];
  summary: {
    playersProcessed: number;
    playersWithErrors: number;
    totalNewResults: number;
  };
}

async function readTrackedPlayers(): Promise<string[]> {
  if (!existsSync(TRACKED_PLAYERS_FILE)) {
    throw new Error(
      `Tracked players file not found: ${TRACKED_PLAYERS_FILE}\n` +
      `Create this file with comma or newline separated PDGA numbers.`
    );
  }

  const content = await readFile(TRACKED_PLAYERS_FILE, "utf-8");

  // Support both comma-separated and newline-separated formats
  const pdgaNumbers = content
    .split(/[,\n]/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0 && /^\d+$/.test(n));

  if (pdgaNumbers.length === 0) {
    throw new Error("No valid PDGA numbers found in tracked_players.txt");
  }

  return pdgaNumbers;
}

async function processPlayer(
  pdgaNumber: string,
  repository: PlayerRepository,
  placementRange: PlacementRange | null
): Promise<TrackingResult> {
  const result: TrackingResult = {
    pdgaNumber,
    playerName: null,
    newResults: [],
    totalResultsFound: 0,
  };

  try {
    // Ensure player exists in tracked_players table
    let player = await repository.getTrackedPlayer(pdgaNumber);
    if (!player) {
      player = await repository.addTrackedPlayer(pdgaNumber);
      console.log(`  Added new player to database: ${pdgaNumber}`);
    }
    result.playerName = player.name;

    // Fetch the player's profile HTML directly from pdga.com
    console.log(`  Fetching profile...`);
    const html = await fetchPlayerHtml(pdgaNumber);
    const parsed = parsePlayerProfile(html, pdgaNumber);

    // Apply placement filter
    const filteredResults = filterResultsByPlacement(parsed.results, placementRange);
    result.totalResultsFound = filteredResults.length;

    // Get existing tournament URLs to identify new results
    const existingUrls = await repository.getExistingTournamentUrls(pdgaNumber);

    // Find truly new results
    const newResults = filteredResults.filter(
      (r) => !existingUrls.has(r.tournament.url)
    );

    if (newResults.length > 0) {
      // Convert and save new results
      const toSave = newResults.map((r) =>
        repository.convertToNewResult(pdgaNumber, r)
      );
      const saved = await repository.saveResults(toSave);
      result.newResults = saved;
      console.log(`  Found ${saved.length} new result(s)`);
    } else {
      console.log(`  No new results`);
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    console.error(`  Error: ${result.error}`);
  }

  return result;
}

async function trackPlayers(placementArg?: string): Promise<TrackingReport> {
  const report: TrackingReport = {
    timestamp: new Date().toISOString(),
    placementFilter: null,
    results: [],
    summary: {
      playersProcessed: 0,
      playersWithErrors: 0,
      totalNewResults: 0,
    },
  };

  try {
    // Parse placement filter
    report.placementFilter = parsePlacementRange(placementArg);

    // Read tracked players
    const pdgaNumbers = await readTrackedPlayers();
    console.log(`Found ${pdgaNumbers.length} player(s) to track`);
    if (report.placementFilter) {
      console.log(
        `Placement filter: ${report.placementFilter.min}-${report.placementFilter.max}`
      );
    }

    const repository = new PlayerRepository();

    // Process each player
    for (const pdgaNumber of pdgaNumbers) {
      console.log(`\nProcessing player ${pdgaNumber}...`);
      const result = await processPlayer(pdgaNumber, repository, report.placementFilter);
      report.results.push(result);
      report.summary.playersProcessed++;

      if (result.error) {
        report.summary.playersWithErrors++;
      }
      report.summary.totalNewResults += result.newResults.length;

      // Small delay between requests to be nice to pdga.com
      if (pdgaNumbers.indexOf(pdgaNumber) < pdgaNumbers.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } finally {
    await closeDb();
  }

  return report;
}

async function getUnnotifiedResults(): Promise<StoredResult[]> {
  const repository = new PlayerRepository();
  try {
    return await repository.getUnnotifiedResults();
  } finally {
    await closeDb();
  }
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const placementArg = process.argv[3];

  if (!command || command === "sync") {
    // Sync mode: fetch and process all tracked players
    console.log("=== Player Tracker - Sync Mode ===\n");
    const report = await trackPlayers(placementArg);

    console.log("\n=== Summary ===");
    console.log(`Players processed: ${report.summary.playersProcessed}`);
    console.log(`Players with errors: ${report.summary.playersWithErrors}`);
    console.log(`Total new results: ${report.summary.totalNewResults}`);

    if (report.summary.totalNewResults > 0) {
      console.log("\n=== New Results ===");
      console.log(JSON.stringify(report, null, 2));
    }
  } else if (command === "pending") {
    // Pending mode: show results that haven't been notified
    console.log("=== Unnotified Results ===\n");
    const results = await getUnnotifiedResults();

    if (results.length === 0) {
      console.log("No pending notifications.");
    } else {
      console.log(JSON.stringify(results, null, 2));
    }
  } else if (command === "help" || command === "--help" || command === "-h") {
    console.log("Usage: npm run track [command] [placement]");
    console.log("");
    console.log("Commands:");
    console.log("  sync [placement]  Fetch and sync all tracked players (default)");
    console.log("  pending           Show results pending notification");
    console.log("  help              Show this help message");
    console.log("");
    console.log("Placement filter examples:");
    console.log('  npm run track sync         # All results');
    console.log('  npm run track sync 1       # Only 1st place');
    console.log('  npm run track sync "1-5"   # Top 5 placements');
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Use "npm run track help" for usage information.');
    process.exit(1);
  }
}

// Only run main() when executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error) => {
    console.error("Fatal error:", error.message);
    process.exit(1);
  });
}

export { trackPlayers, getUnnotifiedResults, readTrackedPlayers };
