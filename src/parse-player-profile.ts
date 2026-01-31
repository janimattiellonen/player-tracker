import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import type { TournamentResult, PlayerResults } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const PROFILES_DIR = join(PROJECT_ROOT, "profiles");
const PDGA_BASE_URL = "https://www.pdga.com";

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

  if (!pdgaNumber) {
    console.error("Usage: npm run parse-player <PDGA_NUMBER>");
    console.error("Example: npm run parse-player 262774");
    process.exit(1);
  }

  if (!/^\d+$/.test(pdgaNumber)) {
    console.error("Error: Please provide a valid PDGA number (numeric value)");
    process.exit(1);
  }

  try {
    const html = await fetchPlayerData(pdgaNumber);
    const playerResults = parsePlayerProfile(html, pdgaNumber);

    console.log(JSON.stringify(playerResults, null, 2));
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
