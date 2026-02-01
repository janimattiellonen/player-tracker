# Player Tracker

A tool for tracking selected players' PDGA (Professional Disc Golf Association) tournament results and notifying when a tracked player performs well.

## Overview

The tool accepts PDGA numbers of players to track and periodically checks their tournament results. When a player performs within a defined range (e.g., top 5), the result is logged and a notification is sent.

## Features

- Fetch player profile HTML from pdga.com
- Parse tournament results from player profiles
- Extract place, points, tournament name/URL, tier, dates, and prize information
- Filter results by placement range
- Persist results in PostgreSQL database
- Track which results have been processed to avoid duplicate notifications

## Tech Stack

- TypeScript
- Node.js
- Cheerio (HTML parsing)
- PostgreSQL (database)
- Knex (migrations & query builder)
- Docker (containerization)
- Vitest (testing)

## Prerequisites

- Node.js 18+
- Docker and Docker Compose

## Installation

```bash
npm install
```

## Database Setup

### Start the database

```bash
npm run db:start
```

This starts a PostgreSQL container on port 5430.

### Run migrations

```bash
npm run db:migrate
```

### Stop the database

```bash
npm run db:stop
```

### Database credentials

| Setting  | Value          |
|----------|----------------|
| Host     | localhost      |
| Port     | 5430           |
| Database | player_tracker |
| User     | player_tracker |
| Password | player_tracker |

### Accessing the database

#### Using psql inside the container

```bash
docker exec -it player-tracker-db psql -U player_tracker -d player_tracker
```

#### Common psql commands

```sql
-- List all tables
\dt

-- Describe a table
\d tracked_players
\d tournament_results

-- View tracked players
SELECT * FROM tracked_players;

-- View tournament results
SELECT * FROM tournament_results;

-- View unnotified results
SELECT * FROM tournament_results WHERE notified_at IS NULL;

-- Exit psql
\q
```

#### Using an external client

Connect with any PostgreSQL client (pgAdmin, DBeaver, etc.) using:
- Host: `localhost`
- Port: `5430`
- Database: `player_tracker`
- User: `player_tracker`
- Password: `player_tracker`

## Configuration

Copy the example configuration file:

```bash
cp config.example.json config.json
```

Edit `config.json` to add players you want to track:

```json
{
  "placementFilter": "1-5",
  "players": [
    {
      "pdgaNumber": "262774",
      "name": "Antti Kärpijoki"
    }
  ]
}
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
npm run parse-player <PDGA_NUMBER> [PLACEMENT]
```

Examples:
```bash
npm run parse-player 262774           # All results
npm run parse-player 262774 1         # Only 1st place
npm run parse-player 262774 "1-3"     # Top 3 placements
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

## Database Migrations

Create a new migration:

```bash
npm run db:migrate:make <migration_name>
```

Run pending migrations:

```bash
npm run db:migrate
```

Rollback the last migration batch:

```bash
npm run db:migrate:rollback
```

## Project Structure

```
player-tracker/
├── src/
│   ├── fetch-player-profile.ts  # Fetches player HTML from pdga.com
│   ├── parse-player-profile.ts  # Parses HTML to extract results
│   ├── types.ts                 # TypeScript type definitions
│   ├── db.ts                    # Database connection
│   ├── repository.ts            # Database operations
│   └── __tests__/
│       ├── parse-player-profile.test.ts
│       └── fixtures/
│           └── player-262774.html
├── migrations/                  # Knex database migrations
├── profiles/                    # Saved player profile HTML files
├── docker-compose.yml           # Docker configuration
├── knexfile.js                  # Knex configuration
├── config.example.json          # Example configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

### tracked_players

| Column     | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | serial    | Primary key                    |
| pdga_number| varchar   | PDGA number (unique)           |
| name       | varchar   | Player name (optional)         |
| active     | boolean   | Whether to track this player   |
| created_at | timestamp | When the player was added      |
| updated_at | timestamp | When the player was last updated|

### tournament_results

| Column          | Type      | Description                         |
|-----------------|-----------|-------------------------------------|
| id              | serial    | Primary key                         |
| pdga_number     | varchar   | PDGA number (foreign key)           |
| place           | varchar   | Placement in tournament             |
| points          | varchar   | Points earned                       |
| tournament_name | varchar   | Tournament name                     |
| tournament_url  | varchar   | URL to tournament page              |
| tier            | varchar   | Tournament tier (A, B, C, etc.)     |
| dates           | varchar   | Tournament dates                    |
| prize           | varchar   | Prize money                         |
| created_at      | timestamp | When the result was saved           |
| notified_at     | timestamp | When notification was sent (null if not yet) |

## Development Phases

### Phase 1 (Complete)
- Basic script to fetch and parse player profile HTML
- Local file storage for testing
- JSON output of tournament results
- Placement range filtering

### Phase 2 (Current)
- Docker containerization
- PostgreSQL database for persisting data
- Track processed results to avoid duplicates

### Future Phases
- Email notifications for top performances
- Scheduled daily execution
- Web interface for configuration

## License

ISC
