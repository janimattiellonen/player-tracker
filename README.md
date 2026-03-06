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
- Scheduled tracking with configurable intervals (hourly, daily, custom cron)
- Email notifications for new results (Gmail SMTP supported)

## Tech Stack

- TypeScript
- Node.js
- Cheerio (HTML parsing)
- PostgreSQL (database)
- Knex (migrations & query builder)
- Docker (containerization)
- node-cron (scheduling)
- Nodemailer (email notifications)
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

### Track players

The tracking system fetches and syncs results for all players listed in `tracked_players.txt`.

Create a `tracked_players.txt` file with PDGA numbers (one per line or comma-separated):

```
262774
12345
67890
```

Run tracking manually:

```bash
npm run track sync              # All results
npm run track sync "1-3"        # Only top 3 placements
npm run track sync 1            # Only 1st place
```

View results pending notification:

```bash
npm run track pending
```

### Scheduled tracking

Run the scheduler to automatically track players at regular intervals:

```bash
npm run scheduler
```

#### Configuration

Configure the scheduler using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TRACK_SCHEDULE` | When to run (preset or cron expression) | `daily` |
| `TRACK_PLACEMENT` | Placement filter | `1-3` |
| `TRACK_RUN_ON_START` | Run sync immediately on startup | `true` |
| `NOTIFY_ENABLED` | Send email notifications after sync | `true` |

#### Schedule presets

| Preset | Cron Expression | Description |
|--------|-----------------|-------------|
| `every-minute` | `* * * * *` | Every minute |
| `every-5-minutes` | `*/5 * * * *` | Every 5 minutes |
| `every-15-minutes` | `*/15 * * * *` | Every 15 minutes |
| `every-30-minutes` | `*/30 * * * *` | Every 30 minutes |
| `every-hour` | `0 * * * *` | Every hour at :00 |
| `every-6-hours` | `0 */6 * * *` | Every 6 hours |
| `every-12-hours` | `0 */12 * * *` | Every 12 hours |
| `daily` | `0 8 * * *` | Daily at 8:00 AM |
| `daily-morning` | `0 8 * * *` | Daily at 8:00 AM |
| `daily-evening` | `0 20 * * *` | Daily at 8:00 PM |

#### Examples

```bash
# Run every hour, track top 3 placements
TRACK_SCHEDULE=every-hour TRACK_PLACEMENT=1-3 npm run scheduler

# Run once daily, track only wins
TRACK_SCHEDULE=daily TRACK_PLACEMENT=1 npm run scheduler

# Custom cron expression (every 2 hours)
TRACK_SCHEDULE="0 */2 * * *" npm run scheduler

# Skip initial sync on startup
TRACK_RUN_ON_START=false TRACK_SCHEDULE=every-hour npm run scheduler
```

#### Using .env file

Create a `.env` file (copy from `.env.example`) for persistent configuration:

```bash
cp .env.example .env
```

Edit `.env`:

```
TRACK_SCHEDULE=every-hour
TRACK_PLACEMENT=1-3
TRACK_RUN_ON_START=true
```

Then simply run:

```bash
npm run scheduler
```

### Email notifications

Send email notifications for new (unnotified) results:

```bash
npm run notify
```

#### Mock mode

For testing without sending real emails, enable mock mode:

```bash
EMAIL_MOCK_MODE=true npm run notify
```

This prints the email content to the console instead of sending it.

#### Gmail SMTP setup

To send real emails via Gmail:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Configure `.env`:**

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_TO=recipient@example.com
EMAIL_MOCK_MODE=false
```

#### Test email configuration

Test your email setup with:

```bash
npm run test-email
```

Or send to a specific recipient:

```bash
npm run test-email recipient@example.com
```

#### Email content

Notifications include:
- Summary of new results
- Player PDGA numbers
- Tournament names with links
- Placements (1st, 2nd, 3rd, etc.)
- Dates, tiers, points, and prizes
- Both plain text and HTML versions

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
│   ├── track-players.ts         # Main tracking logic
│   ├── scheduler.ts             # Scheduled tracking with cron
│   ├── notify.ts                # Email notification sender
│   ├── notification-builder.ts  # Builds notification messages
│   ├── email-service.ts         # Email sending service
│   ├── test-email.ts            # Email configuration tester
│   ├── types.ts                 # TypeScript type definitions
│   ├── db.ts                    # Database connection
│   ├── repository.ts            # Database operations
│   └── __tests__/
│       ├── parse-player-profile.test.ts
│       ├── notification-builder.test.ts
│       └── fixtures/
│           ├── player-262774.html
│           └── player-27555.html
├── migrations/                  # Knex database migrations
├── profiles/                    # Saved player profile HTML files
├── tracked_players.txt          # PDGA numbers to track (gitignored)
├── docker-compose.yml           # Docker configuration
├── knexfile.js                  # Knex configuration
├── config.example.json          # Example configuration
├── .env.example                 # Example environment variables
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

### Phase 2 (Complete)
- Docker containerization
- PostgreSQL database for persisting data
- Track processed results to avoid duplicates
- Scheduled tracking with configurable intervals
- Email notifications for new results (Gmail SMTP)

### Future Phases
- Web interface for configuration
- Support for additional notification channels (Slack, Discord, etc.)

## License

ISC
