import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePlayerProfile } from "../parse-player-profile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, "fixtures");

describe("parsePlayerProfile", () => {
  let html: string;
  const pdgaNumber = "262774";

  beforeAll(async () => {
    html = await readFile(join(FIXTURES_DIR, `player-${pdgaNumber}.html`), "utf-8");
  });

  it("should return the correct PDGA number", () => {
    const result = parsePlayerProfile(html, pdgaNumber);
    expect(result.pdgaNumber).toBe(pdgaNumber);
  });

  it("should parse tournament results from the HTML", () => {
    const result = parsePlayerProfile(html, pdgaNumber);
    expect(result.results).toBeInstanceOf(Array);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("should correctly parse place values", () => {
    const result = parsePlayerProfile(html, pdgaNumber);
    result.results.forEach((r) => {
      expect(r.place).toBeDefined();
      expect(r.place).not.toBe("");
    });
  });

  it("should correctly parse tournament names and URLs", () => {
    const result = parsePlayerProfile(html, pdgaNumber);
    result.results.forEach((r) => {
      expect(r.tournament.name).toBeDefined();
      expect(r.tournament.name).not.toBe("");
      expect(r.tournament.url).toMatch(/^https:\/\/www\.pdga\.com/);
    });
  });

  it("should correctly parse points values", () => {
    const result = parsePlayerProfile(html, pdgaNumber);
    result.results.forEach((r) => {
      expect(r.points).toBeDefined();
    });
  });

  it("should correctly parse tier values", () => {
    const result = parsePlayerProfile(html, pdgaNumber);
    result.results.forEach((r) => {
      expect(r.tier).toBeDefined();
      expect(r.tier).not.toBe("");
    });
  });

  it("should correctly parse dates", () => {
    const result = parsePlayerProfile(html, pdgaNumber);
    result.results.forEach((r) => {
      expect(r.dates).toBeDefined();
      expect(r.dates).not.toBe("");
    });
  });

  it("should correctly parse prize values", () => {
    const result = parsePlayerProfile(html, pdgaNumber);
    result.results.forEach((r) => {
      expect(r.prize).toBeDefined();
    });
  });

  it("should parse the expected results for player 262774", () => {
    const result = parsePlayerProfile(html, pdgaNumber);

    expect(result.results).toHaveLength(2);

    expect(result.results[0]).toEqual({
      place: "2",
      points: "5.00",
      tournament: {
        name: "Meilahden Kauden Avaus 2026",
        url: "https://www.pdga.com/tour/event/99225#MPO",
      },
      tier: "C",
      dates: "18-Jan-2026",
      prize: "$26",
    });

    expect(result.results[1]).toEqual({
      place: "1",
      points: "10.00",
      tournament: {
        name: "Kirkkonummen Talvi By Fribakisat.fi",
        url: "https://www.pdga.com/tour/event/98946#MPO",
      },
      tier: "C",
      dates: "25-Jan-2026",
      prize: "$33",
    });
  });

  it("should return empty results array for HTML with no results table", () => {
    const emptyHtml = "<html><body><p>No results</p></body></html>";
    const result = parsePlayerProfile(emptyHtml, "123456");
    expect(result.results).toEqual([]);
    expect(result.pdgaNumber).toBe("123456");
  });

  it("should skip rows with totals class", () => {
    const htmlWithTotals = `
      <table id="player-results-mpo">
        <tbody>
          <tr><td class="place">1</td><td class="points">10</td><td class="tournament"><a href="/tour/event/123">Test</a></td><td class="tier">C</td><td class="dates">01-Jan-2026</td><td class="prize">$10</td></tr>
          <tr class="totals"><td>Total</td><td>10</td><td></td><td></td><td></td><td>$10</td></tr>
        </tbody>
      </table>
    `;
    const result = parsePlayerProfile(htmlWithTotals, "123456");
    expect(result.results).toHaveLength(1);
  });
});
