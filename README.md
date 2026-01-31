# Player Tracker

A tool for tracking selected players' PDGA (Professional Disc Golf Association) tournament results and notifying when a tracked player performs well.

## Overview

The tool accepts PDGA numbers of players to track and periodically checks their tournament results. When a player performs within a defined range (e.g., top 5), the result is logged and a notification is sent.

## Features

- Fetch player profile HTML from pdga.com
- Parse tournament results from player profiles
- Extract place, points, tournament name/URL, tier, dates, and prize information
- Output results as JSON

## Tech Stack

- TypeScript
- Node.js
- Cheerio (HTML parsing)
- Vitest (testing)

## Installation

```bash
npm install
```

## Usage

### Fetch a player's profile

Downloads and saves the HTML profile page for a given PDGA number:

```bash
npm run fetch-player <PDGA_NUMBER>
```

Example:
```bash
npm run fetch-player 262774
```

This saves the profile to `profiles/player-262774.html`.

### Parse a player's profile

Parses the saved HTML file and outputs tournament results as JSON:

```bash
npm run parse-player <PDGA_NUMBER>
```

Example:
```bash
npm run parse-player 262774
```

Example output:
```json
{
  "pdgaNumber": "262774",
  "results": [
    {
      "place": "2",
      "points": "5.00",
      "tournament": {
        "name": "Meilahden Kauden Avaus 2026",
        "url": "https://www.pdga.com/tour/event/99225#MPO"
      },
      "tier": "C",
      "dates": "18-Jan-2026",
      "prize": "$26"
    }
  ]
}
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Project Structure

```
player-tracker/
├── src/
│   ├── fetch-player-profile.ts  # Fetches player HTML from pdga.com
│   ├── parse-player-profile.ts  # Parses HTML to extract results
│   ├── types.ts                 # TypeScript type definitions
│   └── __tests__/
│       ├── parse-player-profile.test.ts
│       └── fixtures/
│           └── player-262774.html
├── profiles/                    # Saved player profile HTML files
├── package.json
├── tsconfig.json
└── README.md
```

## Development Phases

### Phase 1 (Current)
- Basic script to fetch and parse player profile HTML
- Local file storage for testing
- JSON output of tournament results

### Future Phases
- Docker containerization
- Database for persisting data
- Email notifications for top performances
- Scheduled daily execution

## License

ISC
