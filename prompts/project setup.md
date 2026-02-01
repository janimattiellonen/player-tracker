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

## Script for parsing player profile

Create a script named `parse-player-profile.ts` which can be called using `npm run parse-player [PDGA NUMBER]`. At this point, make the script read the file found in `profiles/player-[PDGA NUMBER].html` file. Assume the html file exists. If it doesn't, yield an error and ask the user to first run `npm run fetch-player [PDGA NUMBER]`.

If the file `profiles/player-[PDGA NUMBER].html` exists parse the content for 

- Place
- Points
- Tournament
- Tier
- Dates
- Prize

Initially, no requirement for value in "Place". Let's return all results that are found in the html file. The results should be returned in JSON. Create proper type for the results data. 


## Unit tests for verifying parse-player-profile.ts

Next up, let's add unit tests for file `parse-player-profile.ts`. 

Install and use vitest framework. For the tests, copy profiles/player-262774.html so that we have an own source file for the tests. 


## Fetch players within specified placement


Next, let's implement a way to fetch results where palcement is within specified range.

The specified range may be given as a command line argument. 

Allowed values:
- "" no value given. Fetch all results.
- "1": include only those results where the placement is "1"
- "1-3" or "1 - 3": include only those results where the placement is between 1 and 3

In any other case, an error should be returned.


## Keeping track of selected players' performances

Currently I need to provide the script the player's PDGA number and placement requirements. In future I may want to track more than 10 players. I need a better way to provide the PDGA numbers. The placement requirement will most likely be same for all players.

Additionally I want to send a notification on NEW results. Therefore we also need to keep track of, which results has already been processed. For example, looking at player profile file `/Users/janimattiellonen/Documents/Development/Frisbeegolf/player-tracker/profiles/player-262774.html` we can see, that the player has 2 results for year 2026. If we assume these two has already been processed, we don't want the script to process this player again, until a third result can be found.

### Persisting player results

I was thinking of persisting the data in a database. The script can then check againsta the database to see, if there are any new results for the given player.

### Updated tech stack

- Docker environment
- Postgresql
    - run on port 5430

### Database structure

The following data needs to be persisted:
- Place
- Points
- Tournament
- Tier
- Dates
- Prize

In addition to these, any other columns that help the script to keep track and see, if new results needs to be notified.

### Migrations

I'd lik to use some kind of migration tool / framework to allow me to update the database structure. Suggest something. 






