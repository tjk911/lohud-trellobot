# TJN/lohud's Slackbot

Run ``npm install`` to install dependencies, ``npm start`` to run the project, project code lives in Gulpfile.

 - Using Jade for page templating (does little to nothing right now)
 - Proxy works on data server (through Apache2 proxypass config)
 - Plugged in Angularjs (does little to nothing right now)

Run ``forever gulpfile.js`` to keep service running on server "forever"

##What this bot does

This bot does a number of things right now (and hopefully more in the future).

It queries Trello for a specific board and a specific list, and watches it for cards that move in/out and announces it to a channel.

It queries an Outlook inbox and looks for emails from a specific sender and then announces to a channel when there are new emails (essentially, a pull-push notification).

It features a few basic commands, triggered by "trellobot" or "/bot", to manipulate trello cards. Functionality is limited, and is not entirely dynamic (only works with a few lists, lists were manually configured). 

- trellobot help
- trellobot move
- trellobot list

##Why this bot does what it does

Production communication is moving to Slack. We use Trello to update our story statuses (if it's ready for posting, if it's not) and right now communication is through email - often gets lost and too cumbersome.

This will allow our production/audience team to chat and receive updates.

The Outlook inbox receives specific alerts from various sources. This bot will watch for those and inform the entire production/audience team.

##What are the pieces

- **authHelper.js** authenticates with Outlook through OAuth2.
- **gulpfile.js** currently stores the Trello logic and has basic incoming integration (we will be building custom trello commands)
- **mailer.js** holds the Outlook logic
- **credentials.js** holds your secret keys and tokens. You will need them from Outlook, Slack and Trello.
- **trello.js** holds your trello functionality

##Dependencies

Not all the installed dependencies are currently required/used. I know this is bad and I feel bad. Feel free to junk some. I'll eventually do cleanup. 

##What Kai needs to do next

The gulpfile needs to be cleaned up and refactored. Trello dies occasionally and gets reset, which means we lose our Outlook authentication, that needs to be worked on or figured out. I have yet to figure out why I get a 403 error on Trello randomly.