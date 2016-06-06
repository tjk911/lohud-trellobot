var credentials = require('./credentials')
  , express = require('express')
  , app = express()

var text = channel = username = emoji = '';
var reply;

var parseCommands = function (message, channel, privacy){
  var trello = require('./trello')
  var command = message.split(" ");
  var typeofCommand = command[0];

  // console.log(channel);

  if (typeofCommand == 'move'){
    var assetId = command[1];
    var destination = command[2];

    text = 'We are now moving assetId `' + assetId + '` to destination `' + destination +'`. Please be patient, sometimes our courier hits cybertraffic.';
    username = 'Kif Kroker';
    emoji = ':kif:';

    // console.log(assetId);
    // console.log(destination);
    // console.log(channel);
    trello.move(assetId, destination, channel);

  } else if (typeofCommand == 'list'){
    var listname = command[1];
    console.log(listname);
    console.log(channel);
    text = 'Displaying the list now...';
    username = 'Calculon';
    emoji = ':calculon:';

    trello.list(listname, channel, privacy);

  } else if (typeofCommand == 'help'){
    var typeofHelp = command[1];

    username = 'Prof. Farnsworth';
    emoji = ':farnsworth:';

    if (typeofHelp == undefined){
      text = 'Good news everyone! Type `trellobot help commandlist` to view a list of commands';
    } else if (typeofHelp == 'commandlist'){
      text = 'We currently have three commands! They are `trellobot list`, `trellobot move` and `trellobot help`. Learn how to use them by typing `trellobot help *name of command*`.';
    } else if (typeofHelp == 'list'){
      text = 'Use `trellobot list ready` to view all stories available/ready for posting. Use `trellobot list done` to view all posted stories. Use `trellobot list embargoed` to view all embargoed stories.';
    } else if (typeofHelp == 'move'){
      text = 'Use move, followed by ID number, followed by the name of the list. For example: `move 12345678 done` to move it to Done, or `move 87654321 embargoed` to move to Embargoed. It might take a few moments before the card moves.';
    } else if (typeofHelp == 'help'){
      text = "I think we're stuck in an infinity loop...";
    }
  } else {
    username = 'Prof. Farnsworth';
    emoji = ':farnsworth:';
    text = "I just finished turbo-charging this bot's matter compressor! Type `trellobot help` to get started!";
  }
  packageMessage(text, channel, username, emoji, privacy);
};

var packageMessage = function (text, channel, username, emoji, privacy){
  var message = {
    text: text,
    channel: '#trellotest',
    // channel: channel,
    username: username,
    icon_emoji: emoji,
  };
  reply = message;
  sendMessage(privacy);
};

var sendMessage = function (privacy){
  if (privacy == true){
    return reply;
  } else {
    credentials.slack.send(reply);
  }
};

// var announce = function (){
//   console.log(reply);
//   return reply;
// };

module.exports = {
  parseCommands: parseCommands,
  packageMessage: packageMessage,
  sendMessage: sendMessage,
  // announce: announce
}