# Tracking players

Create a file named `tracked_players.txt` (put it info .gitginore). This file will contain a comma separated list of PDGA numbers for players I want to track.

Create a new script named `track_players.ts` that reads this text file and parses the PDGA numbers. As we currently still partially fake the http request, call the fetch-player command to fetch and persist the html files in the profiles directory. 

Now that we have html files for all tracked players, it's time to add code to synchronize the database with player results. We also need code for check if a certain player's results are new and have yet not been notified about. Notification will at a later point be handled possibly by sending an email, but for now the script may just return json data containing results that no notification has been sent for.


## Periodic tracking

I'd like to run the `npm run track sync "1-3"` command periodically, for example once a 1 day or once every hour. How can I implement this so that I can easilly change whether to run once in an hour or once a day?

