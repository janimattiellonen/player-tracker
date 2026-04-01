import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parsePlayerProfile,
  parsePlacementRange,
  filterResultsByPlacement,
} from "../parse-player-profile.js";
import type { TournamentResult } from "../types.js";

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

describe("parsePlacementRange", () => {
  it("should return null for undefined input", () => {
    expect(parsePlacementRange(undefined)).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(parsePlacementRange("")).toBeNull();
  });

  it("should return null for whitespace-only string", () => {
    expect(parsePlacementRange("   ")).toBeNull();
  });

  it("should parse single number", () => {
    expect(parsePlacementRange("1")).toEqual({ min: 1, max: 1 });
    expect(parsePlacementRange("5")).toEqual({ min: 5, max: 5 });
    expect(parsePlacementRange("10")).toEqual({ min: 10, max: 10 });
  });

  it("should parse range without spaces", () => {
    expect(parsePlacementRange("1-3")).toEqual({ min: 1, max: 3 });
    expect(parsePlacementRange("5-10")).toEqual({ min: 5, max: 10 });
  });

  it("should parse range with spaces", () => {
    expect(parsePlacementRange("1 - 3")).toEqual({ min: 1, max: 3 });
    expect(parsePlacementRange("1  -  3")).toEqual({ min: 1, max: 3 });
  });

  it("should throw error for invalid format", () => {
    expect(() => parsePlacementRange("invalid")).toThrow('Invalid placement format: "invalid"');
    expect(() => parsePlacementRange("1-2-3")).toThrow("Invalid placement format");
    expect(() => parsePlacementRange("abc-def")).toThrow("Invalid placement format");
  });

  it("should throw error when min is greater than max", () => {
    expect(() => parsePlacementRange("5-3")).toThrow("Invalid range: 5 is greater than 3");
  });

  it("should throw error for zero or negative values", () => {
    expect(() => parsePlacementRange("0")).toThrow("Placement must be at least 1");
    expect(() => parsePlacementRange("0-3")).toThrow("Placement values must be at least 1");
  });
});

describe("filterResultsByPlacement", () => {
  const mockResults: TournamentResult[] = [
    {
      place: "1",
      points: "10",
      tournament: { name: "Tournament A", url: "https://example.com/a" },
      tier: "A",
      dates: "01-Jan-2026",
      prize: "$100",
    },
    {
      place: "2",
      points: "8",
      tournament: { name: "Tournament B", url: "https://example.com/b" },
      tier: "B",
      dates: "02-Jan-2026",
      prize: "$50",
    },
    {
      place: "5",
      points: "4",
      tournament: { name: "Tournament C", url: "https://example.com/c" },
      tier: "C",
      dates: "03-Jan-2026",
      prize: "$10",
    },
    {
      place: "10",
      points: "1",
      tournament: { name: "Tournament D", url: "https://example.com/d" },
      tier: "C",
      dates: "04-Jan-2026",
      prize: "$0",
    },
  ];

  it("should return all results when range is null", () => {
    const filtered = filterResultsByPlacement(mockResults, null);
    expect(filtered).toHaveLength(4);
  });

  it("should filter by single placement", () => {
    const filtered = filterResultsByPlacement(mockResults, { min: 1, max: 1 });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].place).toBe("1");
  });

  it("should filter by placement range", () => {
    const filtered = filterResultsByPlacement(mockResults, { min: 1, max: 3 });
    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.place)).toEqual(["1", "2"]);
  });

  it("should filter by wider range", () => {
    const filtered = filterResultsByPlacement(mockResults, { min: 1, max: 5 });
    expect(filtered).toHaveLength(3);
    expect(filtered.map((r) => r.place)).toEqual(["1", "2", "5"]);
  });

  it("should return empty array when no results match", () => {
    const filtered = filterResultsByPlacement(mockResults, { min: 3, max: 4 });
    expect(filtered).toHaveLength(0);
  });

  it("should handle non-numeric placements (DNF, DNS)", () => {
    const resultsWithDNF: TournamentResult[] = [
      ...mockResults,
      {
        place: "DNF",
        points: "0",
        tournament: { name: "Tournament E", url: "https://example.com/e" },
        tier: "C",
        dates: "05-Jan-2026",
        prize: "$0",
      },
    ];
    const filtered = filterResultsByPlacement(resultsWithDNF, { min: 1, max: 10 });
    expect(filtered).toHaveLength(4);
    expect(filtered.find((r) => r.place === "DNF")).toBeUndefined();
  });
});
