import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const PROFILES_DIR = join(PROJECT_ROOT, "profiles");

async function fetchPlayerProfile(pdgaNumber: string): Promise<void> {
  if (!pdgaNumber || !/^\d+$/.test(pdgaNumber)) {
    console.error("Error: Please provide a valid PDGA number (numeric value)");
    process.exit(1);
  }

  const url = `https://www.pdga.com/player/${pdgaNumber}`;
  const outputPath = join(PROFILES_DIR, `player-${pdgaNumber}.html`);

  console.log(`Fetching player profile from: ${url}`);

  try {
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

    console.log(`Profile saved to: ${outputPath}`);
    console.log(`File size: ${html.length} bytes`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error fetching profile: ${error.message}`);
    } else {
      console.error("An unknown error occurred");
    }
    process.exit(1);
  }
}

const pdgaNumber = process.argv[2];

if (!pdgaNumber) {
  console.error("Usage: npm run fetch-player <PDGA_NUMBER>");
  console.error("Example: npm run fetch-player 262774");
  process.exit(1);
}

fetchPlayerProfile(pdgaNumber);
