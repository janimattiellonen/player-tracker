import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const PROFILES_DIR = join(PROJECT_ROOT, "profiles");

export interface FetchResult {
  pdgaNumber: string;
  outputPath: string;
  fileSize: number;
}

export async function fetchPlayerProfile(pdgaNumber: string): Promise<FetchResult> {
  if (!pdgaNumber || !/^\d+$/.test(pdgaNumber)) {
    throw new Error("Please provide a valid PDGA number (numeric value)");
  }

  const url = `https://www.pdga.com/player/${pdgaNumber}`;
  const outputPath = join(PROFILES_DIR, `player-${pdgaNumber}.html`);

  if (!existsSync(PROFILES_DIR)) {
    await mkdir(PROFILES_DIR, { recursive: true });
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const html = await response.text();
  await writeFile(outputPath, html, "utf-8");

  return {
    pdgaNumber,
    outputPath,
    fileSize: html.length,
  };
}

export function getProfilePath(pdgaNumber: string): string {
  return join(PROFILES_DIR, `player-${pdgaNumber}.html`);
}

async function main(): Promise<void> {
  const pdgaNumber = process.argv[2];

  if (!pdgaNumber) {
    console.error("Usage: npm run fetch-player <PDGA_NUMBER>");
    console.error("Example: npm run fetch-player 262774");
    process.exit(1);
  }

  try {
    console.log(`Fetching player profile from: https://www.pdga.com/player/${pdgaNumber}`);
    const result = await fetchPlayerProfile(pdgaNumber);
    console.log(`Profile saved to: ${result.outputPath}`);
    console.log(`File size: ${result.fileSize} bytes`);
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
