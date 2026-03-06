import type { StoredResult } from "./repository.js";

export interface NotificationData {
  results: StoredResult[];
  generatedAt: string;
  playerNames?: Map<string, string>;
}

export interface NotificationMessage {
  subject: string;
  text: string;
  html: string;
}

function groupResultsByPlayer(results: StoredResult[]): Map<string, StoredResult[]> {
  const grouped = new Map<string, StoredResult[]>();

  for (const result of results) {
    const existing = grouped.get(result.pdga_number) || [];
    existing.push(result);
    grouped.set(result.pdga_number, existing);
  }

  return grouped;
}

function formatPlacement(place: string): string {
  const num = parseInt(place, 10);
  if (isNaN(num)) return place;

  const suffix =
    num === 1 ? "st" : num === 2 ? "nd" : num === 3 ? "rd" : "th";
  return `${num}${suffix}`;
}

function formatPlayerLabel(pdgaNumber: string, playerNames?: Map<string, string>): string {
  const name = playerNames?.get(pdgaNumber);
  return name ? `Player #${pdgaNumber} (${name})` : `Player #${pdgaNumber}`;
}

function buildTextMessage(data: NotificationData): string {
  const { results } = data;
  const grouped = groupResultsByPlayer(results);
  const playerCount = grouped.size;
  const resultCount = results.length;

  let text = `PDGA Player Tracker - New Results\n`;
  text += `${"=".repeat(40)}\n\n`;
  text += `Found ${resultCount} new result(s) for ${playerCount} player(s).\n\n`;

  for (const [pdgaNumber, playerResults] of grouped) {
    text += `${formatPlayerLabel(pdgaNumber, data.playerNames)}\n`;
    text += `${"-".repeat(30)}\n`;

    for (const result of playerResults) {
      text += `  ${formatPlacement(result.place)} place - ${result.tournament_name}\n`;
      text += `    Date: ${result.dates}\n`;
      text += `    Tier: ${result.tier || "N/A"}\n`;
      if (result.points) {
        text += `    Points: ${result.points}\n`;
      }
      if (result.prize) {
        text += `    Prize: ${result.prize}\n`;
      }
      text += `    URL: ${result.tournament_url}\n`;
      text += `\n`;
    }
  }

  text += `${"=".repeat(40)}\n`;
  text += `Generated: ${data.generatedAt}\n`;

  return text;
}

function buildHtmlMessage(data: NotificationData): string {
  const { results } = data;
  const grouped = groupResultsByPlayer(results);
  const playerCount = grouped.size;
  const resultCount = results.length;

  let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #2c5530; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; }
    .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .player-section { margin: 20px 0; }
    .player-header { background: #e8e8e8; padding: 10px 15px; font-weight: bold; border-radius: 5px 5px 0 0; }
    .result { border: 1px solid #ddd; border-top: none; padding: 15px; }
    .result:last-child { border-radius: 0 0 5px 5px; }
    .place { font-size: 1.2em; font-weight: bold; color: #2c5530; }
    .place-1 { color: #ffd700; }
    .place-2 { color: #c0c0c0; }
    .place-3 { color: #cd7f32; }
    .tournament-name { font-weight: bold; margin: 5px 0; }
    .details { color: #666; font-size: 0.9em; }
    .details span { margin-right: 15px; }
    .footer { text-align: center; color: #999; font-size: 0.8em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    a { color: #2c5530; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🥏 PDGA Player Tracker</h1>
    <p>New Tournament Results</p>
  </div>

  <div class="summary">
    <strong>Summary:</strong> Found ${resultCount} new result(s) for ${playerCount} player(s).
  </div>
`;

  for (const [pdgaNumber, playerResults] of grouped) {
    html += `
  <div class="player-section">
    <div class="player-header">${formatPlayerLabel(pdgaNumber, data.playerNames)}</div>
`;

    for (const result of playerResults) {
      const placeNum = parseInt(result.place, 10);
      const placeClass = placeNum <= 3 ? `place-${placeNum}` : "";

      html += `
    <div class="result">
      <span class="place ${placeClass}">${formatPlacement(result.place)} place</span>
      <div class="tournament-name">
        <a href="${result.tournament_url}">${result.tournament_name}</a>
      </div>
      <div class="details">
        <span>📅 ${result.dates}</span>
        <span>🏷️ Tier ${result.tier || "N/A"}</span>
        ${result.points ? `<span>⭐ ${result.points} pts</span>` : ""}
        ${result.prize ? `<span>💰 ${result.prize}</span>` : ""}
      </div>
    </div>
`;
    }

    html += `  </div>\n`;
  }

  html += `
  <div class="footer">
    <p>Generated: ${data.generatedAt}</p>
    <p>PDGA Player Tracker</p>
  </div>
</body>
</html>
`;

  return html;
}

function buildSubject(data: NotificationData): string {
  const { results } = data;
  const grouped = groupResultsByPlayer(results);
  const playerCount = grouped.size;
  const resultCount = results.length;

  if (resultCount === 1) {
    const result = results[0];
    const name = data.playerNames?.get(result.pdga_number);
    const playerRef = name ? `#${result.pdga_number} (${name})` : `#${result.pdga_number}`;
    return `PDGA: ${formatPlacement(result.place)} place for ${playerRef} at ${result.tournament_name}`;
  }

  return `PDGA: ${resultCount} new result(s) for ${playerCount} player(s)`;
}

export function buildNotificationMessage(data: NotificationData): NotificationMessage {
  return {
    subject: buildSubject(data),
    text: buildTextMessage(data),
    html: buildHtmlMessage(data),
  };
}

export { groupResultsByPlayer, formatPlacement };
