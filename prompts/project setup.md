# Project setup

A tool for tracking selected players' pdga results and notifying if a tracker player performs well (for example in top 5).

The tool is given pdga numbers of players to track. The tool then periodically goes trough the results for given player for new results. If the player has performed within a defined range, he and the result is logged and a notification is sent.

The tool is meant to be executed on a daily base.

The tool is to be developed in phases, where in the first phase the tool is just a simple script that parses html code. In the later phases, the tool might use Docker and a database for persisting data and to send e-mail notifications.


## Tech stack

The tool is to be built around Typescript.

## Phase 1

A script that accepts a player's pdga number. The script makes an html request to pdga.com using the pdga number in the url. The url looks like https://www.pdga.com/player/[PDGA NUMBER]. A real example could be https://www.pdga.com/player/262774 where 262774 is the PDGA number.

The player's profile page will contain a table including the player's results for a given year. By default, the current year the latest year the player has resutls for, is shown. The results table contains columns (as of now):
- Place
- Points
- Tournament
- Tier
- Dates
- Prize

The "Place" column tells us the player's placement in said tournament. As we are only looking for tournaments where the player has performed well, we are looking at this column first. For example, if we only want to include results where the player has a top 3 placement, we want to include results where the value for the "Place" column is between 1-3.

Initially we only care for the results table shown by default. As of year 2026, the result tables title would be "2026 Tournament Results". For year 2025, "2025 Tournament Results" and so on.

What we want to save, is the value for "Place" and url value for "Tournament".

To make testing easier and to not trigger any possible bot detection mechanism in pdga.com, we should save the html code for a given player while we implement the actual code for parsing the html code.

The project directory is `/Users/janimattiellonen/Documents/Development/Frisbeegolf/player-tracker`.

Create a basic typescript project with a package.json file. We want to call the script using `npm run xxx`.

For obtaining html code for a given player, create a script named `fetch-player-profile.ts` and make it callable using `npm run fetch-player [PDGA NUMBER]`. This script should store the output of the player profile page in directory `profiles/player-[PDGA NUMBER].html`


