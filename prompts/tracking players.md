# Tracking players

Create a file named `tracked_players.txt` (put it info .gitginore). This file will contain a comma separated list of PDGA numbers for players I want to track.

Create a new script named `track_players.ts` that reads this text file and parses the PDGA numbers. As we currently still partially fake the http request, call the fetch-player command to fetch and persist the html files in the profiles directory. 

Now that we have html files for all tracked players, it's time to add code to synchronize the database with player results. We also need code for check if a certain player's results are new and have yet not been notified about. Notification will at a later point be handled possibly by sending an email, but for now the script may just return json data containing results that no notification has been sent for.


## Periodic tracking

I'd like to run the `npm run track sync "1-3"` command periodically, for example once a 1 day or once every hour. How can I implement this so that I can easilly change whether to run once in an hour or once a day?

## Support name of player

The tracked_players.txt file currently contains pdga numebers of players to be tracked. Current
format is numerical values separated by commas or new line. I'd like to extend that by including
the player's name as metadata. The player's name would be optional and if provided, then the
pdga number and the name would be separated by a "|".

### List of accepted inputs

262774
27555|Ville Piippo

#### As comma separated

"262774,27555|Ville Piippo,54747474,484848|Steve Johnson"

#### With new lines

"262774
Ville Piippo
54747474484848|Steve Johnson"

## Add player name e-mail report

Currently the e-mail message sent contains: "Player #262774".

It should include the player name, if it is found in the database.

- player name exists: "Player #PDGA_NUMBER (PLAYER_NAME)"
- player name does not exist: "Player #PDGA_NUMBER"


## System should notice if file `tracked_players.txt` is updated

If I have the scheduler running, I'd like it to notice if I add a new player to the `tracked_players.txt` file so that 
the new player is automatically processed.

For example if I have the scheduler schecking every 6 hours, it might otherwise take many hours before the scheduler
see the new entry.

