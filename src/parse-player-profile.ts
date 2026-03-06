import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import type { TournamentResult, PlayerResults, PlacementRange } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const PROFILES_DIR = join(PROJECT_ROOT, "profiles");
const PDGA_BASE_URL = "https://www.pdga.com";

export function parsePlacementRange(input: string | undefined): PlacementRange | null {
  // Empty or undefined means no filter (return all results)
  if (!input || input.trim() === "") {
    return null;
  }

  const trimmed = input.trim();

  // Single number: "1" or "3"
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num < 1) {
      throw new Error("Placement must be at least 1");
    }
    return { min: num, max: num };
  }

  // Range: "1-3" or "1 - 3"
  const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);

    if (min < 1 || max < 1) {
      throw new Error("Placement values must be at least 1");
    }

    if (min > max) {
      throw new Error(`Invalid range: ${min} is greater than ${max}`);
    }

    return { min, max };
  }

  throw new Error(
    `Invalid placement format: "${input}". Use a single number (e.g., "1") or a range (e.g., "1-3")`
  );
}

export function filterResultsByPlacement(
  results: TournamentResult[],
  range: PlacementRange | null
): TournamentResult[] {
  if (!range) {
    return results;
  }

  return results.filter((result) => {
    const place = parseInt(result.place, 10);
    // Skip non-numeric placements (e.g., "DNF", "DNS")
    if (isNaN(place)) {
      return false;
    }
    return place >= range.min && place <= range.max;
  });
}

export function parsePlayerProfile(html: string, pdgaNumber: string): PlayerResults {
  const $ = cheerio.load(html);
  const results: TournamentResult[] = [];

  // Find all tournament result tables (they have IDs like player-results-mpo, player-results-ma1, etc.)
  $('table[id^="player-results-"]').each((_, table) => {
    $(table)
      .find("tbody tr")
      .each((_, row) => {
        const $row = $(row);

        // Skip total rows
        if ($row.hasClass("totals")) {
          return;
        }

        const place = $row.find("td.place").text().trim();
        const points = $row.find("td.points").text().trim();
        const tier = $row.find("td.tier").text().trim();
        const dates = $row.find("td.dates").text().trim();
        const prize = $row.find("td.prize").text().trim();

        const tournamentCell = $row.find("td.tournament");
        const tournamentLink = tournamentCell.find("a");
        const tournamentName = tournamentLink.text().trim();
        const tournamentHref = tournamentLink.attr("href") || "";
        const tournamentUrl = tournamentHref.startsWith("/")
          ? `${PDGA_BASE_URL}${tournamentHref}`
          : tournamentHref;

        if (place && tournamentName) {
          results.push({
            place,
            points,
            tournament: {
              name: tournamentName,
              url: tournamentUrl,
            },
            tier,
            dates,
            prize,
          });
        }
      });
  });

  return {
    pdgaNumber,
    results,
  };
}

async function fetchPlayerData(pdgaNumber: string): Promise<string> {
  // TODO: Replace with real HTTP request to https://www.pdga.com/player/{pdgaNumber}
  const profilePath = join(PROFILES_DIR, `player-${pdgaNumber}.html`);

  if (!existsSync(profilePath)) {
    throw new Error(
      `Profile file not found at ${profilePath}. Please first run: npm run fetch-player ${pdgaNumber}`
    );
  }

  return readFile(profilePath, "utf-8");
}

async function main(): Promise<void> {
  const pdgaNumber = process.argv[2];
  const placementArg = process.argv[3];

  if (!pdgaNumber) {
    console.error("Usage: npm run parse-player <PDGA_NUMBER> [PLACEMENT]");
    console.error("Examples:");
    console.error("  npm run parse-player 262774         # All results");
    console.error("  npm run parse-player 262774 1       # Only 1st place");
    console.error('  npm run parse-player 262774 "1-3"   # Top 3 placements');
    process.exit(1);
  }

  if (!/^\d+$/.test(pdgaNumber)) {
    console.error("Error: Please provide a valid PDGA number (numeric value)");
    process.exit(1);
  }

  let placementRange: PlacementRange | null;
  try {
    placementRange = parsePlacementRange(placementArg);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }

  try {
    const html = await fetchPlayerData(pdgaNumber);
    const playerResults = parsePlayerProfile(html, pdgaNumber);
    const filteredResults = filterResultsByPlacement(playerResults.results, placementRange);

    const output: PlayerResults = {
      pdgaNumber: playerResults.pdgaNumber,
      results: filteredResults,
    };

    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred");
    }
    process.exit(1);
  }
}

// Only run main() when executed directly, not when imported as a module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
