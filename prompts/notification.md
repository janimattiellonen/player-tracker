# Notification

We now have features for syncing player resutls to database and we have a tool for fetching unnotified results.

Now we need a feature for sending a notification of new results. 

## Flow

- fetch new results that have not been notified of
- create a notification message containing the results
- send the notification as an email message
    - configure an recipient address, where the message is sent to. Should be configurable using .env
- mark the results as notified if email sending succeeded


## Tasks

- suggest a solution with code examples


## Implementation

- in the first phase, mock sending of email in the email client and just print out the to-be sent message
- fetch pdga data for player with PDGA number 27555 and store it in src/__tests__/fixtures
- create unit tests for the notification message builder
    - test creation of notification message for only player 262774
    - test creation of notification messahe for players 262774 and 27555
    - the tests should verify that key components are found in the message
