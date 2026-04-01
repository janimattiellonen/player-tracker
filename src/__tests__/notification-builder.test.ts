import { describe, it, expect } from "vitest";
import {
  buildNotificationMessage,
  formatPlacement,
  groupResultsByPlayer,
} from "../notification-builder.js";
import type { StoredResult } from "../repository.js";

// Mock data for player 262774
const player262774Results: StoredResult[] = [
  {
    id: 1,
    pdga_number: "262774",
    place: "2",
    points: "5.00",
    tournament_name: "Meilahden Kauden Avaus 2026",
    tournament_url: "https://www.pdga.com/tour/event/99225#MPO",
    tier: "C",
    dates: "18-Jan-2026",
    prize: "$26",
    created_at: new Date("2026-01-18"),
    notified_at: null,
  },
  {
    id: 2,
    pdga_number: "262774",
    place: "1",
    points: "10.00",
    tournament_name: "Kirkkonummen Talvi By Fribakisat.fi",
    tournament_url: "https://www.pdga.com/tour/event/98946#MPO",
    tier: "C",
    dates: "25-Jan-2026",
    prize: "$33",
    created_at: new Date("2026-01-25"),
    notified_at: null,
  },
];

// Mock data for player 27555
const player27555Results: StoredResult[] = [
  {
    id: 3,
    pdga_number: "27555",
    place: "1",
    points: "63.00",
    tournament_name: "SFL Masters Tour Viisari by Rieppo Service Oy",
    tournament_url: "https://www.pdga.com/tour/event/98747#MP50",
    tier: "C",
    dates: "10-Jan-2026",
    prize: "$210",
    created_at: new Date("2026-01-10"),
    notified_at: null,
  },
  {
    id: 4,
    pdga_number: "27555",
    place: "2",
    points: "18.00",
    tournament_name: "Meilahden Kauden Avaus 2026",
    tournament_url: "https://www.pdga.com/tour/event/99225#MP50",
    tier: "C",
    dates: "18-Jan-2026",
    prize: "$34",
    created_at: new Date("2026-01-18"),
    notified_at: null,
  },
];

describe("formatPlacement", () => {
  it("should format 1st place correctly", () => {
    expect(formatPlacement("1")).toBe("1st");
  });

  it("should format 2nd place correctly", () => {
    expect(formatPlacement("2")).toBe("2nd");
  });

  it("should format 3rd place correctly", () => {
    expect(formatPlacement("3")).toBe("3rd");
  });

  it("should format 4th and higher with 'th' suffix", () => {
    expect(formatPlacement("4")).toBe("4th");
    expect(formatPlacement("5")).toBe("5th");
    expect(formatPlacement("10")).toBe("10th");
    expect(formatPlacement("21")).toBe("21th");
  });

  it("should return non-numeric values as-is", () => {
    expect(formatPlacement("DNF")).toBe("DNF");
    expect(formatPlacement("DNS")).toBe("DNS");
  });
});

describe("groupResultsByPlayer", () => {
  it("should group results by PDGA number", () => {
    const allResults = [...player262774Results, ...player27555Results];
    const grouped = groupResultsByPlayer(allResults);

    expect(grouped.size).toBe(2);
    expect(grouped.get("262774")).toHaveLength(2);
    expect(grouped.get("27555")).toHaveLength(2);
  });

  it("should handle single player results", () => {
    const grouped = groupResultsByPlayer(player262774Results);

    expect(grouped.size).toBe(1);
    expect(grouped.get("262774")).toHaveLength(2);
  });

  it("should handle empty results", () => {
    const grouped = groupResultsByPlayer([]);

    expect(grouped.size).toBe(0);
  });
});

describe("buildNotificationMessage for single player (262774)", () => {
  const data = {
    results: player262774Results,
    generatedAt: "2026-01-26T10:00:00.000Z",
  };
  const message = buildNotificationMessage(data);

  describe("subject", () => {
    it("should contain result count", () => {
      expect(message.subject).toContain("2 new result(s)");
    });

    it("should contain player count", () => {
      expect(message.subject).toContain("1 player(s)");
    });
  });

  describe("text message", () => {
    it("should contain player PDGA number", () => {
      expect(message.text).toContain("262774");
    });

    it("should contain tournament names", () => {
      expect(message.text).toContain("Meilahden Kauden Avaus 2026");
      expect(message.text).toContain("Kirkkonummen Talvi By Fribakisat.fi");
    });

    it("should contain placements", () => {
      expect(message.text).toContain("1st place");
      expect(message.text).toContain("2nd place");
    });

    it("should contain dates", () => {
      expect(message.text).toContain("18-Jan-2026");
      expect(message.text).toContain("25-Jan-2026");
    });

    it("should contain tournament URLs", () => {
      expect(message.text).toContain("https://www.pdga.com/tour/event/99225#MPO");
      expect(message.text).toContain("https://www.pdga.com/tour/event/98946#MPO");
    });

    it("should contain points", () => {
      expect(message.text).toContain("5.00");
      expect(message.text).toContain("10.00");
    });

    it("should contain prizes", () => {
      expect(message.text).toContain("$26");
      expect(message.text).toContain("$33");
    });

    it("should contain tier information", () => {
      expect(message.text).toContain("Tier: C");
    });

    it("should contain generated timestamp", () => {
      expect(message.text).toContain("2026-01-26T10:00:00.000Z");
    });
  });

  describe("html message", () => {
    it("should contain player PDGA number", () => {
      expect(message.html).toContain("262774");
    });

    it("should contain tournament names", () => {
      expect(message.html).toContain("Meilahden Kauden Avaus 2026");
      expect(message.html).toContain("Kirkkonummen Talvi By Fribakisat.fi");
    });

    it("should contain tournament links", () => {
      expect(message.html).toContain('href="https://www.pdga.com/tour/event/99225#MPO"');
      expect(message.html).toContain('href="https://www.pdga.com/tour/event/98946#MPO"');
    });

    it("should contain placements with styling", () => {
      expect(message.html).toContain("1st place");
      expect(message.html).toContain("2nd place");
    });

    it("should be valid HTML structure", () => {
      expect(message.html).toContain("<!DOCTYPE html>");
      expect(message.html).toContain("<html>");
      expect(message.html).toContain("</html>");
    });
  });
});

describe("buildNotificationMessage for multiple players (262774 and 27555)", () => {
  const data = {
    results: [...player262774Results, ...player27555Results],
    generatedAt: "2026-01-26T10:00:00.000Z",
  };
  const message = buildNotificationMessage(data);

  describe("subject", () => {
    it("should contain total result count", () => {
      expect(message.subject).toContain("4 new result(s)");
    });

    it("should contain correct player count", () => {
      expect(message.subject).toContain("2 player(s)");
    });
  });

  describe("text message", () => {
    it("should contain both player PDGA numbers", () => {
      expect(message.text).toContain("262774");
      expect(message.text).toContain("27555");
    });

    it("should contain all tournament names", () => {
      expect(message.text).toContain("Meilahden Kauden Avaus 2026");
      expect(message.text).toContain("Kirkkonummen Talvi By Fribakisat.fi");
      expect(message.text).toContain("SFL Masters Tour Viisari by Rieppo Service Oy");
    });

    it("should contain results from player 262774", () => {
      expect(message.text).toContain("$26");
      expect(message.text).toContain("$33");
    });

    it("should contain results from player 27555", () => {
      expect(message.text).toContain("$210");
      expect(message.text).toContain("$34");
      expect(message.text).toContain("63.00");
    });

    it("should contain summary with correct counts", () => {
      expect(message.text).toContain("4 new result(s)");
      expect(message.text).toContain("2 player(s)");
    });
  });

  describe("html message", () => {
    it("should contain both player PDGA numbers", () => {
      expect(message.html).toContain("262774");
      expect(message.html).toContain("27555");
    });

    it("should contain all tournament names with links", () => {
      expect(message.html).toContain("Meilahden Kauden Avaus 2026");
      expect(message.html).toContain("SFL Masters Tour Viisari by Rieppo Service Oy");
    });

    it("should contain summary with correct counts", () => {
      expect(message.html).toContain("4 new result(s)");
      expect(message.html).toContain("2 player(s)");
    });

    it("should have separate sections for each player", () => {
      // Each player should have their own player-section div
      const player262774Section = message.html.includes("Player #262774");
      const player27555Section = message.html.includes("Player #27555");

      expect(player262774Section).toBe(true);
      expect(player27555Section).toBe(true);
    });
  });
});

describe("buildNotificationMessage for single result", () => {
  const singleResult: StoredResult[] = [player262774Results[1]]; // 1st place result
  const data = {
    results: singleResult,
    generatedAt: "2026-01-26T10:00:00.000Z",
  };
  const message = buildNotificationMessage(data);

  it("should have a specific subject for single result", () => {
    expect(message.subject).toContain("1st place");
    expect(message.subject).toContain("#262774");
    expect(message.subject).toContain("Kirkkonummen Talvi By Fribakisat.fi");
  });
});

describe("buildNotificationMessage with player names", () => {
  const playerNames = new Map([["262774", "Antti Kärpijoki"]]);

  it("should include player name in text when available", () => {
    const data = {
      results: player262774Results,
      generatedAt: "2026-01-26T10:00:00.000Z",
      playerNames,
    };
    const message = buildNotificationMessage(data);

    expect(message.text).toContain("Player #262774 (Antti Kärpijoki)");
  });

  it("should include player name in HTML when available", () => {
    const data = {
      results: player262774Results,
      generatedAt: "2026-01-26T10:00:00.000Z",
      playerNames,
    };
    const message = buildNotificationMessage(data);

    expect(message.html).toContain("Player #262774 (Antti Kärpijoki)");
  });

  it("should include player name in subject for single result", () => {
    const data = {
      results: [player262774Results[1]],
      generatedAt: "2026-01-26T10:00:00.000Z",
      playerNames,
    };
    const message = buildNotificationMessage(data);

    expect(message.subject).toContain("#262774 (Antti Kärpijoki)");
  });

  it("should show only PDGA number when name is not in the map", () => {
    const data = {
      results: player27555Results,
      generatedAt: "2026-01-26T10:00:00.000Z",
      playerNames,
    };
    const message = buildNotificationMessage(data);

    expect(message.text).toContain("Player #27555");
    expect(message.text).not.toContain("Player #27555 (");
  });
});
